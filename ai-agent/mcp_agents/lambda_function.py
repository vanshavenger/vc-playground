from github import test_github

def handler(event, context):
    
    ans = test_github()
    
    return {
        'statusCode': 200,
        'body': ans
    }
