from pathlib import Path

import hcl2
import yaml


class _Loader(yaml.SafeLoader):
    """YAML loader that tolerates CloudFormation tags like !Ref and !GetAtt."""


def _ignore_tag(loader, tag_suffix, node):
    if isinstance(node, yaml.ScalarNode):
        return loader.construct_scalar(node)
    if isinstance(node, yaml.SequenceNode):
        return loader.construct_sequence(node)
    return loader.construct_mapping(node)


_Loader.add_multi_constructor("!", _ignore_tag)

def _clean(value):
    """Strip the extra quotes and internal markers python-hcl2 adds."""
    if isinstance(value, dict):
        return {
            _clean(k): _clean(v) for k, v in value.items() if k != "__is_block__"
        }
    if isinstance(value, list):
        return [_clean(v) for v in value]
    if isinstance(value, str) and len(value) >= 2 and value[0] == '"' and value[-1] == '"':
        return value[1:-1]
    return value

def detect_type(path, data):
    """Return 'terraform', 'cloudformation', 'ansible' or 'unknown'."""
    if Path(path).suffix == ".tf":
        return "terraform"
    if isinstance(data, dict) and (
        "AWSTemplateFormatVersion" in data or "Resources" in data
    ):
        return "cloudformation"
    if isinstance(data, list) and any(
        isinstance(play, dict) and ("hosts" in play or "tasks" in play)
        for play in data
    ):
        return "ansible"
    return "unknown"


def parse_file(path):
    """Read an IaC file and return {'file', 'type', 'data'}."""
    path = Path(path)
    with open(path, encoding="utf-8") as f:
        if path.suffix == ".tf":
              data = _clean(hcl2.load(f))
        else:
            data = yaml.load(f, Loader=_Loader)
    return {"file": path.name, "type": detect_type(path, data), "data": data}