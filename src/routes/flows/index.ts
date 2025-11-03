/**
 * Flows router aggregator
 * Combines all orchestrated flow endpoints
 */

import { Hono } from 'hono';
import type { Env } from '../../utils/types';
import createPageWithBlocks from './createPageWithBlocks';
import cloneDatabaseSchema from './cloneDatabaseSchema';
import searchAndTag from './searchAndTag';
import orchestrateMarkdownToPages from './orchestrateMarkdownToPages';

const flows = new Hono<{ Bindings: Env }>();

// Mount flow endpoints
flows.route('/createPageWithBlocks', createPageWithBlocks);
flows.route('/cloneDatabaseSchema', cloneDatabaseSchema);
flows.route('/searchAndTag', searchAndTag);
flows.route('/orchestrateMarkdownToPages', orchestrateMarkdownToPages);

export default flows;
