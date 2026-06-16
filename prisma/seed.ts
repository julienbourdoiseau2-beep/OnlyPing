import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const coachPassword = await bcrypt.hash("coach1234", 10);
  const userPassword = await bcrypt.hash("user1234", 10);
  const adminPassword = await bcrypt.hash("admin1234", 10);

  const coach = await prisma.user.upsert({
    where: { email: "coach@onlyping.fr" },
    update: {},
    create: {
      name: "Lucas Martin",
      email: "coach@onlyping.fr",
      passwordHash: coachPassword,
      role: "COACH",
      coachProfile: {
        create: {
          bio: "Ancien joueur national, specialise topspin et jeu de jambes.",
          specialty: "Topspin coup droit",
          yearsActive: 12
        }
      }
    }
  });

  await prisma.user.upsert({
    where: { email: "user@onlyping.fr" },
    update: {},
    create: {
      name: "Emma Dubois",
      email: "user@onlyping.fr",
      passwordHash: userPassword,
      role: "USER"
    }
  });

  await prisma.user.upsert({
    where: { email: "admin@onlyping.fr" },
    update: {},
    create: {
      name: "Admin OnlyPing",
      email: "admin@onlyping.fr",
      passwordHash: adminPassword,
      role: "ADMIN"
    }
  });

  const videoData = [
    {
      title: "Service court coupe: precision en 20 minutes",
      slug: "service-court-coupe",
      description: "Construis un service court coupe stable avec routine, placement et variation d'effet.",
      category: "SERVICE",
      level: "Intermediaire",
      durationMin: 22,
      priceCents: 1990,
      thumbnail: "https://images.unsplash.com/photo-1611251135345-18f42fcd2f7c",
      videoUrl: "https://example.com/videos/service-court-coupe.mp4"
    },
    {
      title: "Bloc actif revers: vitesse et controle",
      slug: "bloc-actif-revers",
      description: "Travaille le timing de bloc actif avec exercices progressifs pour match reel.",
      category: "REVERS",
      level: "Avance",
      durationMin: 34,
      priceCents: 2490,
      thumbnail: "https://images.unsplash.com/photo-1521417531039-9c4f88df15cf",
      videoUrl: "https://example.com/videos/bloc-actif-revers.mp4"
    }
  ];

  for (const video of videoData) {
    await prisma.video.upsert({
      where: { slug: video.slug },
      update: {
        ...video,
        coachId: coach.id,
        isPublished: true
      },
      create: {
        ...video,
        coachId: coach.id,
        isPublished: true
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });