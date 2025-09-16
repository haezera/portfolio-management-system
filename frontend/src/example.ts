import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Fetch the first 5 rows from eom_prices
  const prices = await prisma.eOMPrices.findMany({
    take: 5
  })

  console.log('Sample rows from eom_prices:')
  console.log(prices)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })