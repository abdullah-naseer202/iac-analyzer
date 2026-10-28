REMEDIATIONS = {
    "TF-SEC-001": '''variable "db_password" {
  type      = string
  sensitive = true
}

resource "aws_db_instance" "example" {
  password = var.db_password
}''',
    "TF-S3-001": '''resource "aws_s3_bucket_public_access_block" "example" {
  bucket                  = aws_s3_bucket.example.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}''',
    "TF-SG-001": '''ingress {
  from_port   = 22
  to_port     = 22
  protocol    = "tcp"
  cidr_blocks = ["203.0.113.10/32"]  # your trusted IP only
}''',
    "TF-DB-001": '''resource "aws_db_instance" "example" {
  storage_encrypted = true
}''',
    "TF-DB-002": '''resource "aws_db_instance" "example" {
  publicly_accessible = false
}''',
    "CFN-S3-001": '''MyBucket:
  Type: AWS::S3::Bucket
  Properties:
    PublicAccessBlockConfiguration:
      BlockPublicAcls: true
      BlockPublicPolicy: true
      IgnorePublicAcls: true
      RestrictPublicBuckets: true''',
    "CFN-SG-001": '''SecurityGroupIngress:
  - IpProtocol: tcp
    FromPort: 22
    ToPort: 22
    CidrIp: 203.0.113.10/32  # your trusted IP only''',
    "CFN-DB-001": '''MyDB:
  Type: AWS::RDS::DBInstance
  Properties:
    StorageEncrypted: true''',
    "CFN-DB-002": '''MyDB:
  Type: AWS::RDS::DBInstance
  Properties:
    PubliclyAccessible: false''',
    "ANS-SEC-001": '''# Store the secret in an encrypted vault file:
#   ansible-vault encrypt_string 'MySecret' --name 'db_password'
vars:
  db_password: !vault |
    $ANSIBLE_VAULT;1.1;AES256
    ...''',
    "ANS-PERM-001": '''- name: Create config file
  ansible.builtin.file:
    path: /etc/app/config.conf
    state: touch
    mode: "0644"''',
}


def add_remediation(findings):
    """Return findings with a 'fix' code snippet added to each one."""
    return [{**f, "fix": REMEDIATIONS.get(f["rule_id"], "")} for f in findings]