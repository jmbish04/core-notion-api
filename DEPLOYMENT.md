# Deployment Guide

This guide walks through deploying the Notion Proxy Worker to Cloudflare.

## Prerequisites

1. **Cloudflare Account**: Sign up at https://dash.cloudflare.com/sign-up
2. **Wrangler CLI**: Install globally
   ```bash
   npm install -g wrangler
   ```
3. **Notion Integration**: Create at https://www.notion.so/my-integrations

## Step 1: Authenticate with Cloudflare

```bash
wrangler login
```

This opens your browser for authentication.

## Step 2: Create D1 Database

```bash
# Create the database
wrangler d1 create notion_proxy_logs
```

Copy the `database_id` from the output and update `wrangler.jsonc`:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "notion_proxy_logs",
      "database_id": "YOUR_DATABASE_ID_HERE"  // Replace this
    }
  ]
}
```

## Step 3: Run Migrations

```bash
# Apply the database schema
wrangler d1 migrations apply notion_proxy_logs --remote
```

## Step 4: Set Worker Secrets

```bash
# Set your worker API key (choose a strong random string)
wrangler secret put WORKER_API_KEY
# When prompted, enter your chosen API key
```

## Step 5: Deploy

```bash
npm run deploy
```

Your worker will be deployed to: `https://notion-proxy-worker.<your-subdomain>.workers.dev`

## Step 6: Test the Deployment

### Test Health Endpoint

```bash
curl https://notion-proxy-worker.<your-subdomain>.workers.dev/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uptime": 123,
    "timestamp": "2025-11-03T...",
    "environment": "production"
  }
}
```

### Test OpenAPI Spec

```bash
curl https://notion-proxy-worker.<your-subdomain>.workers.dev/openapi
```

Should return the full OpenAPI 3.1.0 specification.

### Test Raw API (Requires Notion Token)

```bash
curl -X GET "https://notion-proxy-worker.<your-subdomain>.workers.dev/api/raw/pages/PAGE_ID" \
  -H "Authorization: Bearer YOUR_WORKER_API_KEY" \
  -H "x-notion-token: YOUR_NOTION_TOKEN"
```

### Test Flow (Create Page with Blocks)

```bash
curl -X POST "https://notion-proxy-worker.<your-subdomain>.workers.dev/api/flows/createPageWithBlocks" \
  -H "Authorization: Bearer YOUR_WORKER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "notion_token": "YOUR_NOTION_TOKEN",
    "parent": { "page_id": "PARENT_PAGE_ID" },
    "title": "Test Page",
    "blocks": [
      {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
          "rich_text": [
            {
              "type": "text",
              "text": { "content": "Hello from the Notion Proxy Worker!" }
            }
          ]
        }
      }
    ]
  }'
```

## Local Development

### Start Development Server

```bash
npm run dev
```

This starts a local server at `http://localhost:8787` with:
- Hot reloading
- Local D1 database simulation
- Environment variable support via `.dev.vars`

### Create `.dev.vars` for Local Secrets

```bash
cat > .dev.vars << EOF
WORKER_API_KEY=test-key-for-local-dev
EOF
```

**Note**: Never commit `.dev.vars` to version control!

## Monitoring

### View Request Logs

```bash
curl "https://notion-proxy-worker.<your-subdomain>.workers.dev/monitor" \
  -H "Authorization: Bearer YOUR_WORKER_API_KEY"
```

### View Worker Logs

```bash
wrangler tail
```

This streams real-time logs from your deployed worker.

## Custom Domain (Optional)

### Add Custom Route

1. Go to Cloudflare Dashboard → Workers & Pages
2. Select your worker
3. Click "Triggers" → "Add Custom Domain"
4. Enter your domain (e.g., `api.yourdomain.com`)

## Troubleshooting

### Issue: "Authentication required"

**Solution**: Ensure you're sending the `Authorization: Bearer <key>` header with your `WORKER_API_KEY`.

### Issue: "Missing x-notion-token header"

**Solution**: Raw API endpoints require both:
- `Authorization: Bearer <WORKER_API_KEY>`
- `x-notion-token: <NOTION_TOKEN>`

### Issue: D1 database errors

**Solution**: 
1. Verify migrations were applied: `wrangler d1 migrations list notion_proxy_logs --remote`
2. Re-run migrations if needed: `wrangler d1 migrations apply notion_proxy_logs --remote`

### Issue: "Module not found" errors

**Solution**: Ensure all dependencies are installed: `npm install`

## Next Steps

1. **Explore OpenAPI Spec**: Visit `/openapi` to see all available endpoints
2. **Set Up ChatGPT Custom Action**: Use the OpenAPI spec to create a custom GPT
3. **Monitor Usage**: Regularly check `/monitor` for request patterns
4. **Scale**: Cloudflare Workers automatically scale with your traffic

## Security Best Practices

1. **Rotate API Keys**: Regularly update your `WORKER_API_KEY`
2. **Use Notion Tokens Carefully**: Never expose your Notion integration token in client-side code
3. **Enable Rate Limiting**: Consider adding rate limiting middleware for production
4. **Monitor Access**: Regularly review `/monitor` logs for suspicious activity

## Support

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Notion API Docs](https://developers.notion.com/)
- [Hono Framework Docs](https://hono.dev/)
