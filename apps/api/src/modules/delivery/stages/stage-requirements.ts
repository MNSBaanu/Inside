import { StageName, WorkLogType } from '@inside/database';

export type RequirementKind = 'FILES' | 'TEXT' | 'WORKLOG';

export type StageRequirement = {
  key: string;
  label: string;
  hint: string;
  kind: RequirementKind;
  min?: number;
  logType?: WorkLogType;
};

export const STAGE_REQUIREMENTS: Record<StageName, StageRequirement[]> = {
  [StageName.PROPOSAL]: [
    {
      key: 'site_visit',
      label: 'Site visit confirmed',
      hint: 'Log the site visit in the Work log. The client confirms it happened.',
      kind: 'WORKLOG',
      logType: WorkLogType.SITE_VISIT,
    },
    {
      key: 'measurements',
      label: 'Room measurements',
      hint: 'Length, width and ceiling height of each room, plus windows, doors and sockets.',
      kind: 'TEXT',
    },
    {
      key: 'site_photos',
      label: 'Site photos',
      hint: 'At least 3 photos of the space as it is today.',
      kind: 'FILES',
      min: 3,
    },
    {
      key: 'scope',
      label: 'Confirmed scope',
      hint: 'What will be designed and installed, and what is not included.',
      kind: 'TEXT',
    },
  ],
  [StageName.CONCEPT]: [
    {
      key: 'concept_boards',
      label: 'Concept options',
      hint: 'At least 2 concept boards with mood images and a colour palette.',
      kind: 'FILES',
      min: 2,
    },
    {
      key: 'layout',
      label: 'Rough layout',
      hint: 'A layout sketch showing where the main furniture goes.',
      kind: 'FILES',
      min: 1,
    },
    {
      key: 'direction',
      label: 'Design direction',
      hint: 'Explain each option: style, materials and why it suits the client.',
      kind: 'TEXT',
    },
  ],
  [StageName.DESIGN]: [
    {
      key: 'renders',
      label: '3D renders',
      hint: 'At least 3 renders of the chosen concept.',
      kind: 'FILES',
      min: 3,
    },
    {
      key: 'floor_plan',
      label: 'Floor plan',
      hint: 'A measured floor plan with furniture placement.',
      kind: 'FILES',
      min: 1,
    },
    {
      key: 'materials',
      label: 'Materials and furniture list',
      hint: 'Each item with finish, supplier and price in LKR.',
      kind: 'TEXT',
    },
  ],
  [StageName.REVISION]: [
    {
      key: 'revised_files',
      label: 'Revised renders or plans',
      hint: 'The updated drawings after the client feedback.',
      kind: 'FILES',
      min: 1,
    },
    {
      key: 'changes',
      label: 'What changed',
      hint: 'List each change and the feedback it answers.',
      kind: 'TEXT',
    },
  ],
  [StageName.COMPLETION]: [
    {
      key: 'installation',
      label: 'Installation confirmed',
      hint: 'Log the installation in the Work log. The client confirms the work on site.',
      kind: 'WORKLOG',
      logType: WorkLogType.INSTALLATION,
    },
    {
      key: 'final_photos',
      label: 'Finished room photos',
      hint: 'At least 3 photos of the finished space.',
      kind: 'FILES',
      min: 3,
    },
    {
      key: 'final_drawings',
      label: 'Final drawings',
      hint: 'As-built drawings and specifications (PDF or DWG).',
      kind: 'FILES',
      min: 1,
    },
    {
      key: 'handover',
      label: 'Handover note',
      hint: 'Warranties, care instructions and supplier contacts.',
      kind: 'TEXT',
    },
  ],
};

export function requirementFor(stage: StageName, key: string) {
  return STAGE_REQUIREMENTS[stage].find((item) => item.key === key);
}
