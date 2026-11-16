export default function Loading() {
  return (
    <div className="shell page">
      <div className="h-7 w-48 animate-pulse rounded-pill bg-sand" />
      <div className="mt-10 h-16 w-full max-w-4xl animate-pulse rounded-card bg-sand md:h-24" />
      <div className="mt-4 h-16 w-2/3 max-w-3xl animate-pulse rounded-card bg-sand md:h-24" />
      <div className="mt-14 aspect-[16/10] w-full animate-pulse rounded-card bg-sand md:aspect-[21/9]" />
    </div>
  );
}
