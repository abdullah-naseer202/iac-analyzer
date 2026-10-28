SECRET_KEYS = {"password", "secret", "secret_key", "access_key", "token"}
SENSITIVE_PORTS = {22: "SSH", 3389: "RDP"}
PUBLIC_ACLS = {"public-read", "public-read-write"}
CFN_PUBLIC_ACLS = {"PublicRead", "PublicReadWrite"}


def _finding(rule_id, title, severity, resource, file, recommendation):
    return {
        "rule_id": rule_id,
        "title": title,
        "severity": severity,
        "resource": resource,
        "file": file,
        "recommendation": recommendation,
    }


def _to_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


# ---------------------------------------------------------------- Terraform


def _tf_resources(data):
    for block in data.get("resource", []):
        for rtype, instances in block.items():
            for name, attrs in instances.items():
                yield rtype, name, attrs


def _scan_terraform(parsed):
    findings = []
    file = parsed["file"]

    for rtype, name, attrs in _tf_resources(parsed["data"]):
        res = f"{rtype}.{name}"

        # Hardcoded secrets in any resource
        for key, value in attrs.items():
            if (
                key in SECRET_KEYS
                and isinstance(value, str)
                and value
                and not value.startswith("${")
            ):
                findings.append(_finding(
                    "TF-SEC-001", f"Hardcoded secret in '{key}'", "HIGH", res, file,
                    "Use a variable, AWS Secrets Manager or SSM Parameter Store.",
                ))

        if rtype == "aws_s3_bucket" and attrs.get("acl") in PUBLIC_ACLS:
            findings.append(_finding(
                "TF-S3-001", "S3 bucket is publicly accessible", "HIGH", res, file,
                "Use a private ACL and enable the public access block.",
            ))

        if rtype == "aws_security_group":
            rules = attrs.get("ingress", [])
            if isinstance(rules, dict):
                rules = [rules]
            for rule in rules:
                if "0.0.0.0/0" not in rule.get("cidr_blocks", []):
                    continue
                start = _to_int(rule.get("from_port"))
                end = _to_int(rule.get("to_port"))
                all_ports = str(rule.get("protocol")) == "-1"
                for port, label in SENSITIVE_PORTS.items():
                    if all_ports or (
                        start is not None and end is not None and start <= port <= end
                    ):
                        findings.append(_finding(
                            "TF-SG-001", f"{label} (port {port}) open to the world",
                            "HIGH", res, file,
                            "Restrict cidr_blocks to trusted IP ranges.",
                        ))

        if rtype == "aws_db_instance":
            if attrs.get("storage_encrypted") is not True:
                findings.append(_finding(
                    "TF-DB-001", "Database storage is not encrypted", "MEDIUM", res, file,
                    "Set storage_encrypted = true.",
                ))
            if attrs.get("publicly_accessible") is True:
                findings.append(_finding(
                    "TF-DB-002", "Database is publicly accessible", "HIGH", res, file,
                    "Set publicly_accessible = false and use private subnets.",
                ))

    return findings


# ------------------------------------------------------------ CloudFormation


def _scan_cloudformation(parsed):
    findings = []
    file = parsed["file"]
    resources = parsed["data"].get("Resources") or {}

    for name, definition in resources.items():
        if not isinstance(definition, dict):
            continue
        rtype = definition.get("Type")
        props = definition.get("Properties") or {}

        if rtype == "AWS::S3::Bucket" and props.get("AccessControl") in CFN_PUBLIC_ACLS:
            findings.append(_finding(
                "CFN-S3-001", "S3 bucket is publicly accessible", "HIGH", name, file,
                "Remove the public AccessControl and add PublicAccessBlockConfiguration.",
            ))

        if rtype == "AWS::EC2::SecurityGroup":
            for rule in props.get("SecurityGroupIngress") or []:
                if not isinstance(rule, dict):
                    continue
                open_world = (
                    rule.get("CidrIp") == "0.0.0.0/0"
                    or rule.get("CidrIpv6") == "::/0"
                )
                if not open_world:
                    continue
                start = _to_int(rule.get("FromPort"))
                end = _to_int(rule.get("ToPort"))
                all_ports = str(rule.get("IpProtocol")) == "-1"
                for port, label in SENSITIVE_PORTS.items():
                    if all_ports or (
                        start is not None and end is not None and start <= port <= end
                    ):
                        findings.append(_finding(
                            "CFN-SG-001", f"{label} (port {port}) open to the world",
                            "HIGH", name, file,
                            "Restrict CidrIp to trusted IP ranges.",
                        ))

        if rtype == "AWS::RDS::DBInstance":
            if props.get("StorageEncrypted") is not True:
                findings.append(_finding(
                    "CFN-DB-001", "Database storage is not encrypted", "MEDIUM", name, file,
                    "Set StorageEncrypted: true.",
                ))
            if props.get("PubliclyAccessible") is True:
                findings.append(_finding(
                    "CFN-DB-002", "Database is publicly accessible", "HIGH", name, file,
                    "Set PubliclyAccessible: false.",
                ))

    return findings


# ------------------------------------------------------------------- Ansible


def _secret_vars(variables, resource, file):
    findings = []
    if not isinstance(variables, dict):
        return findings
    for key, value in variables.items():
        lowered = str(key).lower()
        if (
            any(word in lowered for word in ("password", "secret", "token", "api_key"))
            and isinstance(value, str)
            and value
            and not value.startswith("{{")
        ):
            findings.append(_finding(
                "ANS-SEC-001", f"Hardcoded secret in variable '{key}'", "HIGH",
                resource, file, "Use Ansible Vault or an external secret store.",
            ))
    return findings


def _iter_tasks(tasks):
    for task in tasks or []:
        if not isinstance(task, dict):
            continue
        if "block" in task:
            yield from _iter_tasks(task["block"])
        else:
            yield task


def _world_writable(mode):
    if isinstance(mode, bool):
        return False
    try:
        number = mode if isinstance(mode, int) else int(str(mode), 8)
    except ValueError:
        return False  # symbolic modes like u+rwx are ignored
    return bool(number & 0o002)


def _scan_ansible(parsed):
    findings = []
    file = parsed["file"]

    for play in parsed["data"]:
        if not isinstance(play, dict):
            continue
        play_name = play.get("name", "play")
        findings += _secret_vars(play.get("vars"), play_name, file)

        for task in _iter_tasks(play.get("tasks")):
            task_name = f"{play_name} / {task.get('name', 'task')}"
            findings += _secret_vars(task.get("vars"), task_name, file)
            for value in task.values():
                if isinstance(value, dict) and _world_writable(value.get("mode")):
                    findings.append(_finding(
                        "ANS-PERM-001", "World-writable file permissions", "MEDIUM",
                        task_name, file, "Use a stricter mode such as 0644 or 0600.",
                    ))

    return findings


# --------------------------------------------------------------- Entry point


def scan(parsed):
    """Run the rules that match the parsed file's type."""
    kind = parsed["type"]
    if kind == "terraform":
        return _scan_terraform(parsed)
    if kind == "cloudformation":
        return _scan_cloudformation(parsed)
    if kind == "ansible":
        return _scan_ansible(parsed)
    return []