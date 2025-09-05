# san-juan-sms

## test it

curl -X POST "https://<your-vercel-deployment>.vercel.app/api/sms" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "From=%2B17875551212&To=%2B17876638354&Body=Test%20SMS"