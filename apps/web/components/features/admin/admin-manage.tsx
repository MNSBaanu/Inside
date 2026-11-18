'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import {
  downloadCsv,
  ExportButton,
  fetchAllPages,
} from '@/components/features/admin/admin-export';
import {
  Filters,
  gridRow,
  Results,
  SearchField,
  SectionHeader,
  SelectField,
  useAdminAction,
  useAdminList,
} from '@/components/features/admin/admin-sections';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cardSurface } from '@/components/ui/card';
import { ConfirmDialog, useConfirm } from '@/components/ui/confirm-dialog';
import { ErrorNotice, Skeleton } from '@/components/ui/feedback';
import { Field, Input, Textarea } from '@/components/ui/field';
import { FileUpload } from '@/components/ui/file-upload';
import { StatusBadge } from '@/components/ui/status-badge';
import { api, errorMessage } from '@/lib/api/client';
import { useApi } from '@/lib/api/use-api';
import { cn } from '@/lib/utils/cn';
import { formatDate, formatMoney, titleCase } from '@/lib/utils/format';

type Person = { id: string; name: string; avatarUrl: string | null };

function useEscape(onClose: () => void, disabled: boolean) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !disabled) onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose, disabled]);
}

function Modal({
  title,
  onSubmit,
  children,
  wide = false,
}: {
  title: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-ink/60 p-4">
      <form
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onSubmit={onSubmit}
        className={cn(
          'my-auto flex w-full flex-col gap-4 rounded-card bg-surface p-6 shadow-lift',
          wide ? 'max-w-2xl' : 'max-w-md',
        )}
      >
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        {children}
      </form>
    </div>
  );
}

// Projects

type AdminProject = {
  id: string;
  title: string;
  status: string;
  currentStage: string;
  createdAt: string;
  client: Person;
  designer: Person;
  totalAmount: number | null;
};

const PROJECT_STATUSES = ['ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
const STAGES = ['PROPOSAL', 'CONCEPT', 'DESIGN', 'REVISION', 'COMPLETION'];

const projectsGrid =
  'lg:grid lg:grid-cols-[minmax(0,1fr)_9rem_7rem_9rem_13rem] lg:items-center lg:gap-x-4';

function CancelProjectDialog({
  title,
  busy,
  onCancel,
  onConfirm,
}: {
  title: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  useEscape(onCancel, busy);

  return (
    <Modal
      title={`Cancel "${title}"?`}
      onSubmit={(event) => {
        event.preventDefault();
        onConfirm(reason.trim());
      }}
    >
      <p className="text-sm text-muted">
        The client and designer are told it was cancelled, with your reason.
      </p>
      <Field label="Reason" htmlFor="cancel-reason">
        <Textarea
          id="cancel-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          required
          minLength={3}
          maxLength={500}
          rows={3}
          autoFocus
        />
      </Field>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
          Keep project
        </Button>
        <Button
          type="submit"
          disabled={busy}
          className="!bg-error hover:!bg-error/90"
        >
          {busy ? 'Cancelling…' : 'Cancel project'}
        </Button>
      </div>
    </Modal>
  );
}

function ProjectActions({
  project,
  pending,
  run,
  onCancel,
}: {
  project: { id: string; status: string };
  pending: boolean;
  run: (action: 'hold' | 'resume') => void;
  onCancel: () => void;
}) {
  const { confirm, dialog } = useConfirm();
  const closed = project.status === 'COMPLETED' || project.status === 'CANCELLED';
  if (closed) return null;

  async function confirmRun(action: 'hold' | 'resume') {
    const ok = await confirm(
      action === 'hold'
        ? {
            title: 'Put this project on hold?',
            description: 'The project is paused until an admin resumes it. Both parties are notified.',
            confirmLabel: 'Hold project',
          }
        : {
            title: 'Resume this project?',
            description: 'The project becomes active again and both parties are notified.',
            confirmLabel: 'Resume project',
            tone: 'default',
          },
    );
    if (ok) run(action);
  }

  return (
    <>
      {dialog}
      {project.status === 'ACTIVE' ? (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => void confirmRun('hold')}>
          Hold
        </Button>
      ) : (
        <Button size="sm" disabled={pending} onClick={() => void confirmRun('resume')}>
          Resume
        </Button>
      )}
      <Button
        size="sm"
        variant="outline"
        className="!border-error/40 !text-error hover:!border-error hover:!bg-error hover:!text-canvas"
        disabled={pending}
        onClick={onCancel}
      >
        Cancel
      </Button>
    </>
  );
}

export function ProjectsSection() {
  const [status, setStatus] = useState('');
  const [stage, setStage] = useState('');
  const { list, search, setSearch, page, setPage, filtered } =
    useAdminList<AdminProject>('/admin/projects', { status, stage });
  const { error, pending, run } = useAdminAction();
  const [cancelling, setCancelling] = useState<AdminProject | null>(null);

  async function exportProjects() {
    const items = await fetchAllPages<AdminProject>('/admin/projects', {
      search: search.trim(),
      status,
      stage,
    });
    downloadCsv(
      'projects',
      ['Title', 'Client', 'Designer', 'Stage', 'Status', 'Total (LKR)', 'Started'],
      items.map((project) => [
        project.title,
        project.client.name,
        project.designer.name,
        titleCase(project.currentStage),
        titleCase(project.status),
        project.totalAmount === null ? '' : String(project.totalAmount),
        project.createdAt.slice(0, 10),
      ]),
    );
  }

  return (
    <>
      <SectionHeader
        title="Projects."
        description="Every client and designer project. Put on hold, resume or cancel when needed."
        action={<ExportButton onExport={exportProjects} />}
      />
      <Filters>
        <SearchField
          id="project-search"
          value={search}
          onChange={setSearch}
          placeholder="Project, client or designer"
        />
        <SelectField
          id="project-status"
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: '', label: 'Any status' },
            ...PROJECT_STATUSES.map((value) => ({ value, label: titleCase(value) })),
          ]}
        />
        <SelectField
          id="project-stage"
          label="Stage"
          value={stage}
          onChange={setStage}
          options={[
            { value: '', label: 'Any stage' },
            ...STAGES.map((value) => ({ value, label: titleCase(value) })),
          ]}
        />
      </Filters>

      <Results
        state={list}
        page={page}
        onPageChange={setPage}
        filtered={filtered}
        noun="projects"
        empty="No projects yet."
        actionError={error}
        columns={{
          className: projectsGrid,
          labels: ['Project', 'Total', 'Stage', 'Status', 'Actions'],
        }}
      >
        {(project) => (
          <li
            key={project.id}
            className={cn(gridRow, projectsGrid, 'relative transition-colors hover:bg-sand/40')}
          >
            <div className="min-w-0">
              <Link
                href={`/admin/projects/${project.id}`}
                className="font-semibold after:absolute after:inset-0 hover:underline"
              >
                {project.title}
              </Link>
              <p className="text-sm text-muted">
                {project.client.name} with {project.designer.name} · Started{' '}
                {formatDate(project.createdAt)}
              </p>
            </div>
            <p className="text-sm">{formatMoney(project.totalAmount)}</p>
            <p className="text-sm">{titleCase(project.currentStage)}</p>
            <div>
              <StatusBadge status={project.status} />
            </div>
            <div className="relative z-10 flex flex-wrap items-center gap-2 lg:flex-nowrap lg:justify-end">
              <ProjectActions
                project={project}
                pending={pending === project.id}
                run={(action) =>
                  void run(
                    project.id,
                    `/admin/projects/${project.id}/${action}`,
                    list.reload,
                  )
                }
                onCancel={() => setCancelling(project)}
              />
            </div>
          </li>
        )}
      </Results>

      {cancelling ? (
        <CancelProjectDialog
          title={cancelling.title}
          busy={pending === cancelling.id}
          onCancel={() => setCancelling(null)}
          onConfirm={(reason) =>
            void run(
              cancelling.id,
              `/admin/projects/${cancelling.id}/cancel`,
              list.reload,
              { reason },
            ).finally(() => setCancelling(null))
          }
        />
      ) : null}
    </>
  );
}

type AdminProjectDetail = {
  id: string;
  title: string;
  status: string;
  currentStage: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  client: Person & { email: string };
  designer: Person & { email: string };
  totalAmount: number | null;
  timeline: string;
  scope: string;
  stages: {
    id: string;
    name: string;
    status: string;
    fee: number | null;
    dueDate: string | null;
    approvedAt: string | null;
  }[];
  payments: { id: string; stageId: string; amount: number; status: string }[];
  _count: { messages: number; reviews: number };
};

export function AdminProjectDetail({ id }: { id: string }) {
  const { data, error, reload } = useApi<{ project: AdminProjectDetail }>(
    `/admin/projects/${id}`,
  );
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  async function act(action: string, body: unknown = {}) {
    setActionError(null);
    setPending(true);
    try {
      await api.patch(`/admin/projects/${id}/${action}`, body);
      await reload();
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  if (error) return <ErrorNotice message={error} />;
  if (!data) return <Skeleton className="h-64" />;

  const project = data.project;
  const paid = project.payments
    .filter((payment) => ['PAID', 'RELEASED'].includes(payment.status))
    .reduce((sum, payment) => sum + payment.amount, 0);
  const paymentFor = (stageId: string) =>
    project.payments.find((payment) => payment.stageId === stageId);

  return (
    <div className="flex flex-col gap-6">
      {actionError ? <ErrorNotice message={actionError} /> : null}

      <section className={cn(cardSurface, 'flex flex-wrap items-center justify-between gap-4 p-5 md:p-6')}>
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-semibold">{project.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={project.status} />
            <Badge>{titleCase(project.currentStage)} stage</Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ProjectActions
            project={project}
            pending={pending}
            run={(action) => void act(action)}
            onCancel={() => setCancelling(true)}
          />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Agreed total', value: formatMoney(project.totalAmount) },
          { label: 'Paid so far', value: formatMoney(paid) },
          { label: 'Messages', value: String(project._count.messages) },
          { label: 'Reviews', value: String(project._count.reviews) },
        ].map((item) => (
          <div key={item.label} className={cn(cardSurface, 'p-4')}>
            <p className="font-display text-xl font-semibold">{item.value}</p>
            <p className="mt-1 text-sm text-muted">{item.label}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {[
          { role: 'Client', person: project.client },
          { role: 'Designer', person: project.designer },
        ].map(({ role, person }) => (
          <Link
            key={role}
            href={`/admin/users/${person.id}`}
            className={cn(cardSurface, 'flex items-center gap-3 p-4 transition-colors hover:bg-sand/40')}
          >
            <Avatar name={person.name} src={person.avatarUrl} size={40} />
            <div className="min-w-0">
              <p className="text-label font-semibold uppercase text-muted">{role}</p>
              <p className="font-semibold">{person.name}</p>
              <p className="break-all text-sm text-muted">{person.email}</p>
            </div>
          </Link>
        ))}
      </section>

      <section className={cn(cardSurface, 'overflow-hidden')}>
        <h3 className="border-b border-hairline px-5 py-3 font-semibold md:px-6">Stages</h3>
        <ul className="divide-y divide-hairline">
          {project.stages.map((stage) => {
            const payment = paymentFor(stage.id);
            return (
              <li
                key={stage.id}
                className="grid gap-2 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_8rem_8rem_8rem] sm:items-center md:px-6"
              >
                <p className="font-semibold">{titleCase(stage.name)}</p>
                <p className="text-sm">{formatMoney(stage.fee)}</p>
                <div>
                  <StatusBadge status={stage.status} />
                </div>
                <p className="text-sm text-muted">
                  {payment ? titleCase(payment.status) : 'No payment'}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={cn(cardSurface, 'p-5 md:p-6')}>
        <h3 className="font-semibold">Proposal</h3>
        <p className="mt-1 text-sm text-muted">
          Timeline: {project.timeline} · Started {formatDate(project.startedAt ?? project.createdAt)}
          {project.completedAt ? ` · Completed ${formatDate(project.completedAt)}` : ''}
        </p>
        <p className="mt-3 whitespace-pre-line text-muted">{project.scope}</p>
      </section>

      {cancelling ? (
        <CancelProjectDialog
          title={project.title}
          busy={pending}
          onCancel={() => setCancelling(false)}
          onConfirm={(reason) =>
            void act('cancel', { reason }).finally(() => setCancelling(false))
          }
        />
      ) : null}
    </div>
  );
}

// Shop items

type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  style: string | null;
  price: number;
  imageUrl: string;
  sellerName: string;
  sellerUrl: string;
  isPublished: boolean;
  createdAt: string;
};

const shopGrid =
  'lg:grid lg:grid-cols-[minmax(0,1fr)_10rem_7.5rem_6.5rem_13rem] lg:items-center lg:gap-x-4';

type ProductForm = {
  name: string;
  description: string;
  category: string;
  style: string;
  price: string;
  imageUrl: string;
  sellerName: string;
  sellerUrl: string;
  isPublished: boolean;
};

function ProductDialog({
  product,
  categories,
  sellers,
  onClose,
  onSaved,
}: {
  product: AdminProduct | null;
  categories: string[];
  sellers: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ProductForm>({
    name: product?.name ?? '',
    description: product?.description ?? '',
    category: product?.category ?? '',
    style: product?.style ?? '',
    price: product ? String(product.price) : '',
    imageUrl: product?.imageUrl ?? '',
    sellerName: product?.sellerName ?? '',
    sellerUrl: product?.sellerUrl ?? '',
    isPublished: product?.isPublished ?? true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEscape(onClose, busy);

  const set = (key: keyof ProductForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const body = { ...form, price: Number(form.price) };
    try {
      if (product) {
        await api.patch(`/admin/products/${product.id}`, body);
      } else {
        await api.post('/admin/products', body);
      }
      onSaved();
    } catch (cause) {
      setError(errorMessage(cause));
      setBusy(false);
    }
  }

  return (
    <Modal title={product ? 'Edit shop item' : 'Add shop item'} onSubmit={onSubmit} wide>
      {error ? <ErrorNotice message={error} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="product-name">
          <Input id="product-name" value={form.name} onChange={set('name')} required minLength={2} maxLength={120} autoFocus />
        </Field>
        <Field label="Price (LKR)" htmlFor="product-price">
          <Input id="product-price" type="number" min={0} step="0.01" value={form.price} onChange={set('price')} required />
        </Field>
        <Field label="Category" htmlFor="product-category">
          <Input id="product-category" list="product-categories" value={form.category} onChange={set('category')} required minLength={2} maxLength={60} />
          <datalist id="product-categories">
            {categories.map((value) => <option key={value} value={value} />)}
          </datalist>
        </Field>
        <Field label="Style (optional)" htmlFor="product-style">
          <Input id="product-style" value={form.style} onChange={set('style')} maxLength={60} />
        </Field>
      </div>
      <Field label="Description" htmlFor="product-description">
        <Textarea id="product-description" value={form.description} onChange={set('description')} required minLength={10} maxLength={2000} rows={3} />
      </Field>
      <Field label="Image URL" htmlFor="product-image">
        <div className="flex flex-wrap items-center gap-3">
          {form.imageUrl ? (
            <div className="h-16 w-16 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url("${form.imageUrl}")` }} />
          ) : null}
          <FileUpload
            folder="products"
            label={form.imageUrl ? 'Change image' : 'Upload image'}
            onUploaded={(file) => setForm((current) => ({ ...current, imageUrl: file.url }))}
          />
        </div>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Provider" htmlFor="product-seller" hint="The shop that sells this item.">
          <Input id="product-seller" list="product-sellers" value={form.sellerName} onChange={set('sellerName')} required minLength={2} maxLength={120} />
          <datalist id="product-sellers">
            {sellers.map((value) => <option key={value} value={value} />)}
          </datalist>
        </Field>
        <Field label="Provider link" htmlFor="product-seller-url">
          <Input id="product-seller-url" type="url" value={form.sellerUrl} onChange={set('sellerUrl')} required placeholder="https://" />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isPublished}
          onChange={(event) => setForm((current) => ({ ...current, isPublished: event.target.checked }))}
          className="h-4 w-4 accent-brand"
        />
        Show in the shop
      </label>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : product ? 'Save changes' : 'Add item'}
        </Button>
      </div>
    </Modal>
  );
}

export function ShopSection() {
  const [category, setCategory] = useState('');
  const [seller, setSeller] = useState('');
  const [visibility, setVisibility] = useState('');
  const { list, search, setSearch, page, setPage, filtered } =
    useAdminList<AdminProduct>('/admin/products', { category, seller, visibility });
  const { error, pending, run, dialog } = useAdminAction();
  const [editing, setEditing] = useState<AdminProduct | 'new' | null>(null);
  const [deleting, setDeleting] = useState<AdminProduct | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [options, setOptions] = useState<{ categories: string[]; sellers: string[] }>({
    categories: [],
    sellers: [],
  });

  useEffect(() => {
    if (list.data?.categories && list.data.sellers) {
      setOptions({ categories: list.data.categories, sellers: list.data.sellers });
    }
  }, [list.data]);

  async function onDelete(product: AdminProduct) {
    setDeleteError(null);
    setDeleteBusy(true);
    try {
      await api.delete(`/admin/products/${product.id}`);
      setDeleting(null);
      void list.reload();
    } catch (cause) {
      setDeleteError(errorMessage(cause));
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  }

  async function exportProducts() {
    const items = await fetchAllPages<AdminProduct>('/admin/products', {
      search: search.trim(),
      category,
      seller,
      visibility,
    });
    downloadCsv(
      'shop-items',
      ['Name', 'Category', 'Style', 'Price (LKR)', 'Provider', 'Provider link', 'Shown', 'Added'],
      items.map((product) => [
        product.name,
        product.category,
        product.style ?? '',
        String(product.price),
        product.sellerName,
        product.sellerUrl,
        product.isPublished ? 'Yes' : 'No',
        product.createdAt.slice(0, 10),
      ]),
    );
  }

  return (
    <>
      {dialog}
      <SectionHeader
        title="Shop."
        description="Items in the public shop and the providers that sell them."
        action={
          <div className="flex flex-wrap items-start gap-2">
            <ExportButton onExport={exportProducts} />
            <Button size="sm" onClick={() => setEditing('new')}>
              <Plus aria-hidden className="mr-1.5 h-4 w-4" />
              Add item
            </Button>
          </div>
        }
      />
      {deleteError ? (
        <div className="mb-4">
          <ErrorNotice message={deleteError} />
        </div>
      ) : null}
      <Filters>
        <SearchField
          id="product-search"
          value={search}
          onChange={setSearch}
          placeholder="Item, provider or category"
        />
        <SelectField
          id="product-category-filter"
          label="Category"
          value={category}
          onChange={setCategory}
          options={[
            { value: '', label: 'All categories' },
            ...options.categories.map((value) => ({ value, label: value })),
          ]}
        />
        <SelectField
          id="product-seller-filter"
          label="Provider"
          value={seller}
          onChange={setSeller}
          options={[
            { value: '', label: 'All providers' },
            ...options.sellers.map((value) => ({ value, label: value })),
          ]}
        />
        <SelectField
          id="product-visibility"
          label="Shown"
          value={visibility}
          onChange={setVisibility}
          options={[
            { value: '', label: 'All items' },
            { value: 'published', label: 'In the shop' },
            { value: 'hidden', label: 'Hidden' },
          ]}
        />
      </Filters>

      <Results
        state={list}
        page={page}
        onPageChange={setPage}
        filtered={filtered}
        noun="items"
        empty="No shop items yet."
        actionError={error}
        columns={{
          className: shopGrid,
          labels: ['Item', 'Provider', 'Price', 'Shown', 'Actions'],
        }}
      >
        {(product) => (
          <li key={product.id} className={cn(gridRow, shopGrid)}>
            <div className="flex min-w-0 items-center gap-3">
              <div
                aria-hidden
                className="h-12 w-12 shrink-0 rounded-lg bg-sand bg-cover bg-center"
                style={{ backgroundImage: `url("${product.imageUrl}")` }}
              />
              <div className="min-w-0">
                <Link
                  href={`/shop/${product.slug}`}
                  target="_blank"
                  className="font-semibold hover:underline"
                >
                  {product.name}
                </Link>
                <p className="text-sm text-muted">
                  {product.category}
                  {product.style ? ` · ${product.style}` : ''}
                </p>
              </div>
            </div>
            <a
              href={product.sellerUrl}
              target="_blank"
              rel="noreferrer"
              className="truncate text-sm hover:underline"
            >
              {product.sellerName}
            </a>
            <p className="text-sm">{formatMoney(product.price)}</p>
            <div>
              <Badge tone={product.isPublished ? 'support' : 'neutral'}>
                {product.isPublished ? 'Shown' : 'Hidden'}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:justify-end">
              <Button
                size="sm"
                variant="ghost"
                disabled={pending === product.id}
                onClick={() =>
                  void run(
                    product.id,
                    `/admin/products/${product.id}`,
                    list.reload,
                    { isPublished: !product.isPublished },
                    product.isPublished
                      ? {
                          title: `Hide ${product.name}?`,
                          description: 'It is removed from the shop until shown again.',
                          confirmLabel: 'Hide',
                        }
                      : {
                          title: `Show ${product.name}?`,
                          description: 'It appears in the shop for everyone.',
                          confirmLabel: 'Show',
                          tone: 'default',
                        },
                  )
                }
              >
                {product.isPublished ? 'Hide' : 'Show'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(product)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="!border-error/40 !text-error hover:!border-error hover:!bg-error hover:!text-canvas"
                onClick={() => setDeleting(product)}
              >
                Delete
              </Button>
            </div>
          </li>
        )}
      </Results>

      {editing ? (
        <ProductDialog
          product={editing === 'new' ? null : editing}
          categories={options.categories}
          sellers={options.sellers}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void list.reload();
          }}
        />
      ) : null}
      {deleting ? (
        <ConfirmDialog
          title={`Delete "${deleting.name}"?`}
          description="It is removed from the shop for good. Hide it instead if you may want it back."
          busy={deleteBusy}
          onConfirm={() => void onDelete(deleting)}
          onCancel={() => setDeleting(null)}
        />
      ) : null}
    </>
  );
}

// Open projects

type AdminOpenRequest = {
  id: string;
  title: string;
  description: string | null;
  timeline: string | null;
  budget: number | null;
  status: string;
  createdAt: string;
  client: Person;
  proposals: number;
};

const openGrid =
  'lg:grid lg:grid-cols-[minmax(0,1fr)_8rem_6rem_7rem_12rem] lg:items-center lg:gap-x-4';

export function OpenProjectsSection() {
  const [status, setStatus] = useState('');
  const { list, search, setSearch, page, setPage, filtered } =
    useAdminList<AdminOpenRequest>('/admin/open-projects', { status });
  const { error, pending, run, dialog } = useAdminAction();

  function setRequestStatus(request: AdminOpenRequest, next: string) {
    const confirmation =
      next === 'CLOSED'
        ? {
            title: `Close "${request.title}"?`,
            description: 'Designers can no longer send proposals. You can reopen it later.',
            confirmLabel: 'Close',
          }
        : next === 'CANCELLED'
          ? {
              title: `Remove "${request.title}"?`,
              description: 'It is taken down from open projects and the client is notified.',
              confirmLabel: 'Remove',
            }
          : {
              title: `Reopen "${request.title}"?`,
              description: 'Designers can see it and send proposals again.',
              confirmLabel: 'Reopen',
              tone: 'default' as const,
            };
    void run(
      request.id,
      `/admin/open-projects/${request.id}/status`,
      list.reload,
      { status: next },
      confirmation,
    );
  }

  async function exportRequests() {
    const items = await fetchAllPages<AdminOpenRequest>('/admin/open-projects', {
      search: search.trim(),
      status,
    });
    downloadCsv(
      'open-projects',
      ['Title', 'Client', 'Budget (LKR)', 'Timeline', 'Proposals', 'Status', 'Posted'],
      items.map((request) => [
        request.title,
        request.client.name,
        request.budget === null ? '' : String(request.budget),
        request.timeline ?? '',
        String(request.proposals),
        titleCase(request.status),
        request.createdAt.slice(0, 10),
      ]),
    );
  }

  return (
    <>
      {dialog}
      <SectionHeader
        title="Open projects."
        description="Public requests clients posted for any designer. Close or remove ones that should not be listed."
        action={<ExportButton onExport={exportRequests} />}
      />
      <Filters>
        <SearchField
          id="open-search"
          value={search}
          onChange={setSearch}
          placeholder="Title, description or client"
        />
        <SelectField
          id="open-status"
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: '', label: 'Any status' },
            ...['OPEN', 'ACCEPTED', 'CLOSED', 'CANCELLED'].map((value) => ({
              value,
              label: titleCase(value),
            })),
          ]}
        />
      </Filters>

      <Results
        state={list}
        page={page}
        onPageChange={setPage}
        filtered={filtered}
        noun="open projects"
        empty="No open projects yet."
        actionError={error}
        columns={{
          className: openGrid,
          labels: ['Open project', 'Budget', 'Proposals', 'Status', 'Actions'],
        }}
      >
        {(request) => (
          <li key={request.id} className={cn(gridRow, openGrid)}>
            <div className="min-w-0">
              <p className="font-semibold">{request.title}</p>
              <p className="text-sm text-muted">
                <Link href={`/admin/users/${request.client.id}`} className="hover:underline">
                  {request.client.name}
                </Link>
                {` · Posted ${formatDate(request.createdAt)}`}
                {request.timeline ? ` · ${request.timeline}` : ''}
              </p>
              {request.description ? (
                <p className="mt-0.5 line-clamp-2 text-sm text-muted">{request.description}</p>
              ) : null}
            </div>
            <p className="text-sm">{formatMoney(request.budget)}</p>
            <p className="text-sm">{request.proposals}</p>
            <div>
              <StatusBadge status={request.status} />
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:justify-end">
              {request.status === 'OPEN' ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending === request.id}
                    onClick={() => setRequestStatus(request, 'CLOSED')}
                  >
                    Close
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="!border-error/40 !text-error hover:!border-error hover:!bg-error hover:!text-canvas"
                    disabled={pending === request.id}
                    onClick={() => setRequestStatus(request, 'CANCELLED')}
                  >
                    Remove
                  </Button>
                </>
              ) : request.status === 'CLOSED' || request.status === 'CANCELLED' ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending === request.id}
                  onClick={() => setRequestStatus(request, 'OPEN')}
                >
                  Reopen
                </Button>
              ) : null}
            </div>
          </li>
        )}
      </Results>
    </>
  );
}
