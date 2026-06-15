import { bootstrap, runMigrations } from '@vendure/core';
import { config } from './vendure-config';
import { setupDemoData } from './demo/demo-fixtures';

runMigrations(config)
    .then(() => bootstrap(config))
    // ⚠️ DEMO ONLY: seed demo data and place a single order so the dashboard has
    // something to show (e.g. the Order Approval workflow). Remove this for
    // production. See ./demo/demo-fixtures.ts.
    .then(app => setupDemoData(app))
    .catch(err => {
        console.log(err);
    });
