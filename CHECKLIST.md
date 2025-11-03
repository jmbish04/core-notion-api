# Pre-Deployment Checklist

Use this checklist before deploying the Notion Proxy Worker to production.

## ✅ Code Quality

- [x] TypeScript compilation passes (`npm run typecheck`)
- [x] All imports resolve correctly
- [x] Strict mode enabled and satisfied
- [x] ESLint/Prettier formatting applied (`npm run format`)
- [x] No console.log statements in production code (using proper logging)
- [x] Error handling in place for all async operations

## ✅ Configuration

- [ ] `wrangler.jsonc` updated with correct database_id
- [ ] Secrets configured (run `wrangler secret list` to verify)
  - [ ] WORKER_API_KEY set
- [ ] Environment variables set if needed
- [ ] Compatibility date is current

## ✅ Database

- [ ] D1 database created (`wrangler d1 create notion_proxy_logs`)
- [ ] Database ID added to wrangler.jsonc
- [ ] Migrations applied (`wrangler d1 migrations apply notion_proxy_logs --remote`)
- [ ] Database schema verified

## ✅ Security

- [x] API key authentication middleware implemented
- [x] Input validation with Zod schemas
- [x] CORS configured appropriately
- [x] No hardcoded secrets in source code
- [ ] Notion tokens handled securely (never logged)
- [ ] Rate limiting considered (future enhancement)

## ✅ Testing

Before deploying, test these endpoints locally (`npm run dev`):

### Health Check
```bash
curl http://localhost:8787/health
# Should return: {"success":true,"data":{"status":"ok",...}}
```

### OpenAPI Spec
```bash
curl http://localhost:8787/openapi
# Should return: OpenAPI 3.1.0 JSON specification
```

### Raw API (with test Notion token)
```bash
curl -X GET "http://localhost:8787/api/raw/users" \
  -H "Authorization: Bearer test-key" \
  -H "x-notion-token: YOUR_TEST_TOKEN"
# Should return: User list or error if token invalid
```

### Flow Orchestration
```bash
curl -X POST "http://localhost:8787/api/flows/createPageWithBlocks" \
  -H "Authorization: Bearer test-key" \
  -H "Content-Type: application/json" \
  -d '{
    "notion_token": "YOUR_TEST_TOKEN",
    "parent": {"page_id": "TEST_PAGE_ID"},
    "title": "Test Page"
  }'
# Should create a page or return validation error
```

### Monitor (with auth)
```bash
curl "http://localhost:8787/monitor" \
  -H "Authorization: Bearer test-key"
# Should return: {"success":true,"data":{"logs":[],"flowRuns":[]}}
```

## ✅ Documentation

- [x] README.md is up to date
- [x] DEPLOYMENT.md has clear instructions
- [x] ARCHITECTURE.md documents system design
- [x] OpenAPI spec is comprehensive
- [x] Code comments are clear and helpful

## ✅ Production Readiness

- [ ] Custom domain configured (optional)
- [ ] Monitoring set up (Cloudflare dashboard)
- [ ] Alerting configured (optional)
- [ ] Backup strategy for D1 database
- [ ] Rollback plan documented

## ✅ Performance

- [x] Async operations optimized
- [x] D1 queries use indexes
- [x] Response times measured
- [ ] Load testing completed (recommended)

## ✅ Compliance

- [ ] Data privacy requirements met
- [ ] Notion API terms of service reviewed
- [ ] User consent for data collection (if applicable)
- [ ] GDPR compliance (if applicable)

## Deployment Steps

Once all items are checked:

1. **Final Code Review**
   ```bash
   npm run typecheck
   npm run format
   git status
   ```

2. **Test Locally**
   ```bash
   npm run dev
   # Test all endpoints listed above
   ```

3. **Deploy to Production**
   ```bash
   npm run deploy
   ```

4. **Verify Deployment**
   ```bash
   # Test health endpoint
   curl https://your-worker.workers.dev/health
   
   # Check logs
   wrangler tail
   ```

5. **Monitor Initial Traffic**
   - Watch Cloudflare dashboard
   - Check `/monitor` endpoint
   - Verify D1 database entries

## Post-Deployment

- [ ] Verify all endpoints are accessible
- [ ] Check error rates in Cloudflare dashboard
- [ ] Test with real Notion integration
- [ ] Document any issues encountered
- [ ] Update team on deployment status

## Rollback Procedure

If issues occur:

1. **Immediate Rollback**
   ```bash
   wrangler rollback
   ```

2. **Alternative: Deploy Previous Version**
   ```bash
   git checkout <previous-commit>
   npm run deploy
   ```

3. **Investigation**
   - Check `wrangler tail` for errors
   - Review D1 database for issues
   - Check Cloudflare analytics

## Support

- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Notion API: https://developers.notion.com/
- Issues: Create ticket in project repository

---

**Last Updated**: 2025-11-03  
**Version**: 1.0.0
