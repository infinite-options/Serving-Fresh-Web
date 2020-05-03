import boto3

db = boto3.client('dynamodb', region_name='us-west-1')
s3 = boto3.client('s3', region_name='us-west-1')