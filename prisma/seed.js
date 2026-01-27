import "dotenv/config";
import pkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const { PrismaClient } = pkg;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

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
      { name: "Mario Kart Stadium" },
      { name: "Water Park" },
      { name: "Sweet Sweet Canyon" },
      { name: "Thwomp Ruins" },
      { name: "Mario Circuit" },
      { name: "Toad Harbor" },
      { name: "Twisted Mansion" },
      { name: "Shy Guy Falls" },
      { name: "Sunshine Airport" },
      { name: "Dolphin Shoals" },
      { name: "Electrodrome" },
      { name: "Mount Wario" },
      { name: "Cloudtop Cruise" },
      { name: "Bone-Dry Dunes" },
      { name: "Bowser's Castle" },
      { name: "Rainbow Road" },
      { name: "Wii Moo Moo Meadows" },
      { name: "GBA Mario Circuit" },
      { name: "DS Cheep Cheep Beach" },
      { name: "N64 Toad's Turnpike" },
      { name: "GCN Dry Dry Desert" },
      { name: "SNES Donut Plains 3" },
      { name: "N64 Royal Raceway" },
      { name: "3DS DK Jungle" },
      { name: "DS Wario Stadium" },
      { name: "GCN Sherbet Land" },
      { name: "3DS Music Park" },
      { name: "N64 Yoshi Valley" },
      { name: "DS Tick-Tock Clock" },
      { name: "3DS Piranha Plant Slide" },
      { name: "Wii Grumble Volcano" },
      { name: "N64 Rainbow Road" },
      { name: "GCN Yoshi Circuit" },
      { name: "Excitebike Arena" },
      { name: "Dragon Driftway" },
      { name: "Mute City" },
      { name: "Wii Wario's Gold Mine" },
      { name: "SNES Rainbow Road" },
      { name: "Ice Ice Outpost" },
      { name: "Hyrule Circuit" },
      { name: "GCN Baby Park" },
      { name: "GBA Cheese Land" },
      { name: "Wild Woods" },
      { name: "Animal Crossing" },
      { name: "3DS Neo Bowser City" },
      { name: "GBA Ribbon Road" },
      { name: "Super Bell Subway" },
      { name: "Big Blue" },
      { name: "Tour Paris Promenade" },
      { name: "3DS Toad Circuit" },
      { name: "N64 Choco Mountain" },
      { name: "Wii Coconut Mall" },
      { name: "Tour Tokyo Blur" },
      { name: "DS Shroom Ridge" },
      { name: "GBA Sky Garden" },
      { name: "Ninja Hideaway" },
      { name: "Tour New York Minute" },
      { name: "SNES Mario Circuit 3" },
      { name: "N64 Kalimari Desert" },
      { name: "DS Waluigi Pinball" },
      { name: "Tour Sydney Sprint" },
      { name: "GBA Snow Land" },
      { name: "Wii Mushroom Gorge" },
      { name: "Sky-High Sundae" },
      { name: "Tour London Loop" },
      { name: "GBA Boo Lake" },
      { name: "3DS Rock Rock Mountain" },
      { name: "Wii Maple Treeway" },
      { name: "Berlin Byways" },
      { name: "DS Peach Gardens" },
      { name: "Merry Mountain" },
      { name: "3DS Rainbow Road" },
      { name: "Tour Amsterdam Drift" },
      { name: "GBA Riverside Park" },
      { name: "Wii DK Summit" },
      { name: "Yoshi's Island" },
      { name: "Tour Bangkok Rush" },
      { name: "DS Mario Circuit" },
      { name: "GCN Waluigi Stadium" },
      { name: "Tour Singapore Speedway" },
      { name: "Tour Athens Dash" },
      { name: "GCN Daisy Cruiser" },
      { name: "Wii Moonview Highway" },
      { name: "Squeaky Clean Sprint" },
      { name: "Tour Los Angeles Laps" },
      { name: "GBA Sunset Wilds" },
      { name: "Wii Koopa Cape" },
      { name: "Tour Vancouver Velocity" },
      { name: "Tour Rome Avanti" },
      { name: "GCN DK Mountain" },
      { name: "Wii Daisy Circuit" },
      { name: "Piranha Plant Cove" },
      { name: "Tour Madrid Drive" },
      { name: "3DS Rosalina's Ice World" },
      { name: "SNES Bowser Castle 3" },
      { name: "Wii Rainbow Road" },
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
