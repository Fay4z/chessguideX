import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const certificate = await prisma.certificate.findUnique({
    where: { verificationCode: code },
    select: { course: { select: { title: true } } },
  });
  return {
    title: certificate
      ? `${certificate.course.title} certificate — ChessGuideX`
      : "Certificate — ChessGuideX",
  };
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const certificate = await prisma.certificate.findUnique({
    where: { verificationCode: code },
    include: { user: { select: { name: true } }, course: true },
  });
  if (!certificate) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-14">
      <div className="rounded-3xl border border-emerald-300 bg-white p-10 text-center shadow-sm dark:border-emerald-700 dark:bg-zinc-900">
        <svg
          className="mx-auto h-12 w-12 text-emerald-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
        <p className="mt-4 text-xs font-medium uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
          Verified certificate
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          {certificate.course.title} — ChessGuideX
        </h1>
        <p className="mt-4 text-sm text-zinc-500">
          This certifies that
        </p>
        <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          {certificate.user.name ?? "A ChessGuideX student"}
        </p>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          has completed the {certificate.course.title} course through the
          ChessGuideX learning path.
        </p>
        <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <dl className="flex justify-between">
            <dt className="text-zinc-500">Issued</dt>
            <dd className="font-medium">
              {certificate.issuedAt.toLocaleDateString()}
            </dd>
          </dl>
          <dl className="mt-2 flex justify-between">
            <dt className="text-zinc-500">Course level</dt>
            <dd className="font-medium capitalize">
              {certificate.course.level.toLowerCase()}
            </dd>
          </dl>
          <dl className="mt-2 flex justify-between">
            <dt className="text-zinc-500">Verification code</dt>
            <dd className="font-mono">{certificate.verificationCode}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}