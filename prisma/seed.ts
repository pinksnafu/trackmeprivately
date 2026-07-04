import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const website = await prisma.website.upsert({
    where: { domain: 'mathiaskoeppel.com' },
    update: {},
    create: {
      domain: 'mathiaskoeppel.com',
      name: 'Mathias Personal Site',
    },
  })

  // Create some mock events
  const today = new Date();
  
  for (let i = 0; i < 50; i++) {
    const randomDate = new Date(today.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
    const oss = ['Windows', 'macOS', 'iOS', 'Android'];
    const deviceTypes = ['desktop', 'mobile', 'tablet'];
    const urls = ['/', '/about', '/projects', '/contact'];
    
    await prisma.event.create({
      data: {
        websiteId: website.id,
        sessionId: `mock-session-${Math.floor(Math.random() * 100)}`,
        eventName: 'pageview',
        url: urls[Math.floor(Math.random() * urls.length)],
        browser: browsers[Math.floor(Math.random() * browsers.length)],
        os: oss[Math.floor(Math.random() * oss.length)],
        deviceType: deviceTypes[Math.floor(Math.random() * deviceTypes.length)],
        createdAt: randomDate,
      }
    })
  }

  console.log('Database seeded successfully')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
