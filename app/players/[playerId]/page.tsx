export default function PlayerDetailPage({
  params,
}: {
  params: { playerId: string };
}) {
  return <main>Player: {params.playerId}</main>;
}
