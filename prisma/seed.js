import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  await prisma.player.createMany({
    data: [
      { name: "Matt" },
      { name: "Jake" },
      { name: "Ian" },
      { name: "Sam" },
    ],
    skipDuplicates: true,
  });

  await prisma.track.createMany({
    data: [
      { name: "Mario Circuit" },
      { name: "Moo Moo Meadows" },
      { name: "Coconut Mall" },
      { name: "Rainbow Road" },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
