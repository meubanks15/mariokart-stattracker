export default function RoundDetailPage({
  params,
}: {
  params: { roundId: string };
}) {
  return <main>Round: {params.roundId}</main>;
}
