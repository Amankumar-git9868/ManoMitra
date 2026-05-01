import { User } from '../models/User.js'

export const seedAdminUser = async () => {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) return

  const normalizedEmail = email.toLowerCase().trim()
  const existing = await User.findOne({ email: normalizedEmail }).select('+password')

  if (!existing) {
    await User.create({
      name: 'Admin',
      email: normalizedEmail,
      password,
      role: 'admin',
    })
    console.log(`Admin user created: ${normalizedEmail}`)
    return
  }

  const needsRoleUpdate = existing.role !== 'admin'
  existing.role = 'admin'
  existing.password = password
  await existing.save()

  console.log(
    needsRoleUpdate
      ? `Admin user promoted and updated: ${normalizedEmail}`
      : `Admin user updated: ${normalizedEmail}`,
  )
}

