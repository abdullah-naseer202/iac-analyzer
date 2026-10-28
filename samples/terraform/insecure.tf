resource "aws_s3_bucket" "public_data" {
  bucket = "demo-public-bucket"
  acl    = "public-read"
}

resource "aws_security_group" "open_ssh" {
  name = "open-ssh"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "demo_db" {
  engine              = "mysql"
  instance_class      = "db.t3.micro"
  username            = "admin"
  password            = "Admin12345"
  storage_encrypted   = false
  publicly_accessible = true
}