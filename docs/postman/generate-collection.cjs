/**
 * Generates docs/postman/Inside.postman_collection.json from known routes + sample bodies.
 * Run: node docs/postman/generate-collection.cjs
 */
const fs = require('fs');
const path = require('path');

const outDir = __dirname;

function uid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function url(rawPath) {
  const segments = rawPath.split('/').filter(Boolean);
  return {
    raw: `{{baseUrl}}${rawPath.startsWith('/') ? rawPath : '/' + rawPath}`,
    host: ['{{baseUrl}}'],
    path: segments.map((s) =>
      s.startsWith(':') ? `{{${s.slice(1)}}}` : s,
    ),
  };
}

function req(name, method, rawPath, opts = {}) {
  const { body, auth, description, query } = opts;
  const item = {
    name,
    request: {
      method,
      header: body
        ? [{ key: 'Content-Type', value: 'application/json' }]
        : [],
      url: url(rawPath),
      description: description || '',
    },
    response: [],
  };

  if (query?.length) {
    item.request.url.query = query;
  }

  if (auth === false) {
    item.request.auth = { type: 'noauth' };
  }

  if (body !== undefined) {
    item.request.body = {
      mode: 'raw',
      raw: JSON.stringify(body, null, 2),
      options: { raw: { language: 'json' } },
    };
  }

  return item;
}

const loginTests = {
  listen: 'test',
  script: {
    type: 'text/javascript',
    exec: [
      'if (pm.response.code === 200 || pm.response.code === 201) {',
      '  const json = pm.response.json();',
      '  const data = json.data || json;',
      '  if (data.accessToken) pm.collectionVariables.set("accessToken", data.accessToken);',
      '  if (data.refreshToken) pm.collectionVariables.set("refreshToken", data.refreshToken);',
      '  if (data.user && data.user.id) pm.collectionVariables.set("userId", data.user.id);',
      '}',
    ],
  },
};

const folders = [
  {
    name: '00 Health',
    item: [req('Health check', 'GET', '/health', { auth: false })],
  },
  {
    name: '01 Auth',
    item: [
      {
        ...req('Register client', 'POST', '/auth/register', {
          auth: false,
          body: {
            email: 'demo-client@inside.test',
            password: 'Password123!',
            name: 'Demo Client',
            role: 'CLIENT',
          },
        }),
        event: [loginTests],
      },
      {
        ...req('Register designer', 'POST', '/auth/register', {
          auth: false,
          body: {
            email: 'demo-designer@inside.test',
            password: 'Password123!',
            name: 'Demo Designer',
            role: 'DESIGNER',
          },
        }),
        event: [loginTests],
      },
      {
        ...req('Login (seed client)', 'POST', '/auth/login', {
          auth: false,
          body: {
            email: 'client@inside.test',
            password: 'Password123!',
          },
          description:
            'Seed users: client@ / designer@ / admin@inside.test — Password123!',
        }),
        event: [loginTests],
      },
      {
        ...req('Login (seed designer)', 'POST', '/auth/login', {
          auth: false,
          body: {
            email: 'designer@inside.test',
            password: 'Password123!',
          },
        }),
        event: [loginTests],
      },
      {
        ...req('Login (seed admin)', 'POST', '/auth/login', {
          auth: false,
          body: {
            email: 'admin@inside.test',
            password: 'Password123!',
          },
        }),
        event: [loginTests],
      },
      req('Refresh', 'POST', '/auth/refresh', {
        auth: false,
        body: { refreshToken: '{{refreshToken}}' },
      }),
      req('Me', 'GET', '/auth/me'),
      req('Logout', 'POST', '/auth/logout', {
        body: { refreshToken: '{{refreshToken}}' },
      }),
      req('Forgot password', 'POST', '/auth/forgot-password', {
        auth: false,
        body: { email: 'client@inside.test' },
      }),
      req('Reset password', 'POST', '/auth/reset-password', {
        auth: false,
        body: {
          token: '{{resetToken}}',
          password: 'Password123!',
        },
      }),
      req('Verify email', 'POST', '/auth/verify-email', {
        auth: false,
        body: { token: '{{verifyToken}}' },
      }),
    ],
  },
  {
    name: '02 Users',
    item: [
      req('Get profile', 'GET', '/users/me'),
      req('Update profile', 'PATCH', '/users/me', {
        body: {
          name: 'Updated Name',
          bio: 'Hello from Postman',
          location: 'Colombo',
        },
      }),
      req('Change password', 'PATCH', '/users/me/password', {
        body: {
          currentPassword: 'Password123!',
          newPassword: 'Password123!',
        },
      }),
      req('Switch active role (designer)', 'PATCH', '/users/me/active-role', {
        body: { activeRole: 'DESIGNER' },
        description: 'Use designer token. Switch between CLIENT and DESIGNER.',
      }),
    ],
  },
  {
    name: '03 Portfolios',
    item: [
      req('List published', 'GET', '/portfolios', {
        auth: false,
        query: [
          { key: 'style', value: '', disabled: true },
          { key: 'roomType', value: '', disabled: true },
          { key: 'page', value: '1', disabled: true },
        ],
      }),
      req('List mine (designer)', 'GET', '/portfolios/mine'),
      req('Get by id', 'GET', '/portfolios/:id'),
      req('Create (designer)', 'POST', '/portfolios', {
        body: {
          title: 'Modern living room',
          description: 'Sample portfolio',
          style: 'Scandinavian',
          roomType: 'Living Room',
          budget: 450000,
          isPublished: true,
          images: [
            {
              imageUrl: 'https://picsum.photos/seed/room/1200/800',
              caption: 'Hero shot',
            },
          ],
        },
      }),
      req('Update', 'PATCH', '/portfolios/:id', {
        body: { title: 'Updated title' },
      }),
      req('Add image', 'POST', '/portfolios/:id/images', {
        body: {
          imageUrl: 'https://picsum.photos/seed/detail/1200/800',
          caption: 'Detail shot',
        },
      }),
      req('Delete image', 'DELETE', '/portfolios/:id/images/:imageId'),
      req('Delete portfolio', 'DELETE', '/portfolios/:id'),
    ],
  },
  {
    name: '04 Favourites',
    item: [
      req('List mine', 'GET', '/favourites'),
      req('Add favourite', 'POST', '/favourites', {
        body: { designerId: '{{designerId}}' },
      }),
      req('Remove favourite', 'DELETE', '/favourites/:designerId'),
    ],
  },
  {
    name: '05 Moodboards',
    item: [
      req('List mine', 'GET', '/moodboards'),
      req('Create', 'POST', '/moodboards', {
        body: { name: 'Living inspiration' },
      }),
      req('Get by id', 'GET', '/moodboards/:id'),
      req('Update', 'PATCH', '/moodboards/:id', {
        body: { name: 'Updated board' },
      }),
      req('Add item', 'POST', '/moodboards/:id/items', {
        body: {
          imageUrl: 'https://placehold.co/600x400',
          note: 'Palette ref',
        },
      }),
      req('Remove item', 'DELETE', '/moodboards/:id/items/:index'),
      req('Delete', 'DELETE', '/moodboards/:id'),
    ],
  },
  {
    name: '06 Briefs',
    item: [
      req('List mine', 'GET', '/briefs'),
      req('Create', 'POST', '/briefs', {
        body: {
          styles: ['Scandinavian', 'Minimalist'],
          rooms: ['Living Room'],
          budgetRange: '400000-800000',
          description: 'Need a calm modern living room',
        },
      }),
      req('Generate from moodboard', 'POST', '/moodboards/:moodboardId/briefs'),
      req('Get by id', 'GET', '/briefs/:id'),
      req('Update', 'PATCH', '/briefs/:id', {
        body: { description: 'Updated brief notes' },
      }),
      req('Delete', 'DELETE', '/briefs/:id'),
    ],
  },
  {
    name: '07 Matching',
    item: [
      req('Match designers for brief', 'GET', '/match/designers', {
        query: [{ key: 'briefId', value: '{{briefId}}' }],
      }),
    ],
  },
  {
    name: '08 Requests',
    item: [
      req('Create OPEN request', 'POST', '/requests', {
        body: {
          title: 'Open living room project',
          description: 'Looking for proposals',
          type: 'OPEN',
          budget: 500000,
          briefId: '{{briefId}}',
        },
      }),
      req('Create DIRECT request', 'POST', '/requests', {
        body: {
          title: 'Direct hire',
          description: 'Invite specific designer',
          type: 'DIRECT',
          designerId: '{{designerId}}',
          budget: 400000,
        },
      }),
      req('List mine', 'GET', '/requests'),
      req('Get by id', 'GET', '/requests/:id'),
      req('Cancel', 'PATCH', '/requests/:id/cancel'),
      req('Close', 'PATCH', '/requests/:id/close'),
    ],
  },
  {
    name: '09 Proposals',
    item: [
      req('Submit proposal (designer)', 'POST', '/requests/:requestId/proposals', {
        body: {
          scope: 'Full design package',
          timeline: '8 weeks',
          stageFees: [
            { name: 'PROPOSAL', fee: 10000 },
            { name: 'CONCEPT', fee: 20000 },
            { name: 'DESIGN', fee: 30000 },
            { name: 'REVISION', fee: 15000 },
            { name: 'COMPLETION', fee: 25000 },
          ],
        },
      }),
      req('List by request', 'GET', '/requests/:requestId/proposals'),
      req('Withdraw (designer)', 'PATCH', '/proposals/:id/withdraw'),
      req('Reject (client)', 'PATCH', '/proposals/:id/reject'),
      req('Accept (client) → creates project', 'PATCH', '/proposals/:id/accept'),
    ],
  },
  {
    name: '10 Projects',
    item: [
      req('List mine', 'GET', '/projects'),
      req('Get by id', 'GET', '/projects/:id'),
      req('Cancel', 'PATCH', '/projects/:id/cancel'),
      req('On hold', 'PATCH', '/projects/:id/on-hold'),
      req('Resume', 'PATCH', '/projects/:id/resume'),
    ],
  },
  {
    name: '11 Stages',
    item: [
      req('List stages', 'GET', '/projects/:projectId/stages'),
      req('Start (designer)', 'PATCH', '/stages/:id/start'),
      req('Submit (designer)', 'PATCH', '/stages/:id/submit'),
      req('Approve (client)', 'PATCH', '/stages/:id/approve'),
      req('Reject (client)', 'PATCH', '/stages/:id/reject', {
        body: { reason: 'Please revise colours' },
      }),
    ],
  },
  {
    name: '12 Deliverables',
    item: [
      req('List', 'GET', '/stages/:stageId/deliverables'),
      req('Upload (designer)', 'POST', '/stages/:stageId/deliverables', {
        body: {
          fileUrl: 'https://placehold.co/1200x800',
          fileName: 'concept-v1.pdf',
          notes: 'Initial concept',
        },
      }),
      req('Feedback (client)', 'PATCH', '/deliverables/:id/feedback', {
        body: { feedback: 'Looks good — minor tweaks' },
      }),
    ],
  },
  {
    name: '13 Messages',
    item: [
      req('List', 'GET', '/projects/:projectId/messages'),
      req('Send', 'POST', '/projects/:projectId/messages', {
        body: { content: 'Hello from Postman' },
      }),
      req('Mark all read', 'PATCH', '/projects/:projectId/messages/read-all'),
      req('Mark one read', 'PATCH', '/messages/:id/read'),
    ],
  },
  {
    name: '14 Payments',
    item: [
      req('List by project', 'GET', '/projects/:projectId/payments'),
      req('Pay (client stub)', 'PATCH', '/payments/:id/pay', {
        body: { stripeIntentId: 'pi_test_postman' },
      }),
      req('Release', 'PATCH', '/payments/:id/release'),
    ],
  },
  {
    name: '15 Reviews',
    item: [
      req('Create (completed project)', 'POST', '/projects/:projectId/reviews', {
        body: { rating: 5, comment: 'Excellent work' },
      }),
      req('List by designer (public)', 'GET', '/designers/:designerId/reviews', {
        auth: false,
      }),
    ],
  },
  {
    name: '16 Notifications',
    item: [
      req('List mine', 'GET', '/notifications'),
      req('Mark one read', 'PATCH', '/notifications/:id/read'),
      req('Mark all read', 'PATCH', '/notifications/read-all'),
    ],
  },
  {
    name: '17 Reports',
    item: [
      req('File report', 'POST', '/reports', {
        body: {
          targetType: 'USER',
          targetId: '{{designerId}}',
          reportedUserId: '{{designerId}}',
          reason: 'Spam / inappropriate',
          details: 'Optional details',
        },
      }),
      req('List mine', 'GET', '/reports/mine'),
    ],
  },
  {
    name: '18 Blocks',
    item: [
      req('List mine', 'GET', '/blocks'),
      req('Block user', 'POST', '/blocks', {
        body: { blockedId: '{{designerId}}', reason: 'Harassment' },
      }),
      req('Unblock', 'DELETE', '/blocks/:blockedId'),
    ],
  },
  {
    name: '19 Verifications',
    item: [
      req('Submit (designer)', 'POST', '/verifications', {
        body: {
          evidenceUrl: 'https://placehold.co/doc.pdf',
          notes: 'NIC + portfolio proof',
        },
      }),
      req('List mine', 'GET', '/verifications/mine'),
      req('Admin pending', 'GET', '/verifications/admin/pending'),
      req('Admin approve', 'PATCH', '/verifications/:id/approve'),
      req('Admin reject', 'PATCH', '/verifications/:id/reject'),
    ],
  },
  {
    name: '20 Admin',
    item: [
      req('List users', 'GET', '/admin/users'),
      req('Suspend user', 'PATCH', '/admin/users/:id/suspend'),
      req('Reactivate user', 'PATCH', '/admin/users/:id/reactivate'),
      req('List open reports', 'GET', '/admin/reports'),
      req('Resolve report', 'PATCH', '/admin/reports/:id/resolve'),
      req('Dismiss report', 'PATCH', '/admin/reports/:id/dismiss'),
    ],
  },
];

const collection = {
  info: {
    _postman_id: uid(),
    name: 'Inside API',
    description:
      'NestJS Phase 2 API for Inside (interior design marketplace).\n\n' +
      '1. Select environment **Inside Local**\n' +
      '2. Run **01 Auth → Login (seed client)** (or designer/admin)\n' +
      '3. `accessToken` is saved automatically for Bearer auth\n' +
      '4. Fill collection variables (`requestId`, `projectId`, etc.) from responses\n\n' +
      'Auth: Bearer JWT (not cookies). Swagger: {{baseUrl}}/api/docs',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  auth: {
    type: 'bearer',
    bearer: [{ key: 'token', value: '{{accessToken}}', type: 'string' }],
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:3001' },
    { key: 'accessToken', value: '' },
    { key: 'refreshToken', value: '' },
    { key: 'userId', value: '' },
    { key: 'designerId', value: '' },
    { key: 'briefId', value: '' },
    { key: 'moodboardId', value: '' },
    { key: 'requestId', value: '' },
    { key: 'proposalId', value: '' },
    { key: 'projectId', value: '' },
    { key: 'stageId', value: '' },
    { key: 'id', value: '' },
    { key: 'imageId', value: '' },
    { key: 'blockedId', value: '' },
    { key: 'verifyToken', value: '' },
    { key: 'resetToken', value: '' },
    { key: 'index', value: '0' },
  ],
  item: folders,
};

const environment = {
  id: uid(),
  name: 'Inside Local',
  values: [
    {
      key: 'baseUrl',
      value: 'http://localhost:3001',
      type: 'default',
      enabled: true,
    },
    { key: 'accessToken', value: '', type: 'secret', enabled: true },
    { key: 'refreshToken', value: '', type: 'secret', enabled: true },
    {
      key: 'seedPassword',
      value: 'Password123!',
      type: 'default',
      enabled: true,
    },
  ],
  _postman_variable_scope: 'environment',
};

fs.writeFileSync(
  path.join(outDir, 'Inside.postman_collection.json'),
  JSON.stringify(collection, null, 2),
);
fs.writeFileSync(
  path.join(outDir, 'Inside.local.postman_environment.json'),
  JSON.stringify(environment, null, 2),
);

const count = folders.reduce((n, f) => n + f.item.length, 0);
console.log(`Wrote collection (${count} requests) + environment to ${outDir}`);
