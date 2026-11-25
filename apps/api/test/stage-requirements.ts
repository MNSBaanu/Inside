import request from 'supertest';
import type { App } from 'supertest/types';

type Requirement = {
  key: string;
  label: string;
  kind: 'FILES' | 'TEXT' | 'WORKLOG';
  min?: number;
  logType?: string;
};

export async function fulfilStageRequirements(
  server: App,
  projectId: string,
  stageId: string,
  designerToken: string,
  clientToken: string,
) {
  const designer = { Authorization: `Bearer ${designerToken}` };
  const client = { Authorization: `Bearer ${clientToken}` };
  const res = await request(server)
    .get(`/stages/${stageId}/requirements`)
    .set(designer)
    .expect(200);

  for (const item of res.body.data.items as Requirement[]) {
    if (item.kind === 'FILES') {
      for (let n = 0; n < (item.min ?? 1); n++) {
        await request(server)
          .post(`/stages/${stageId}/deliverables`)
          .set(designer)
          .send({
            fileUrl: `https://res.cloudinary.com/e2e/${stageId}-${item.key}-${n}.jpg`,
            requirement: item.key,
          })
          .expect(201);
      }
    } else if (item.kind === 'TEXT') {
      await request(server)
        .put(`/stages/${stageId}/requirements/${item.key}`)
        .set(designer)
        .send({ text: `${item.label} for the e2e project` })
        .expect(200);
    } else {
      const logged = await request(server)
        .post(`/projects/${projectId}/work-log`)
        .set(designer)
        .send({
          type: item.logType,
          title: item.label,
          happenedAt: new Date(Date.now() - 60_000).toISOString(),
        })
        .expect(201);
      await request(server)
        .patch(`/work-log/${logged.body.data.entry.id}/confirm`)
        .set(client)
        .expect(200);
    }
  }
}
