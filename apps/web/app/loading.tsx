export default function Loading() {
  return (
    <div className="shell pb-24 pt-40 md:pt-48">
      <div className="h-3 w-40 animate-pulse bg-hairline" />
      <div className="mt-10 h-14 w-full max-w-3xl animate-pulse bg-hairline md:h-20" />
      <div className="mt-4 h-14 w-2/3 max-w-2xl animate-pulse bg-hairline md:h-20" />
      <div className="mt-16 aspect-[16/9] w-full animate-pulse bg-hairline md:aspect-[21/9]" />
    </div>
  );
}
