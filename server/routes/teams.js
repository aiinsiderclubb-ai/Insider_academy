import { Router } from 'express'
import crypto from 'crypto'
import { getDb } from '../db.js'
import { requireUser } from '../middleware/auth.js'
import { prelaunchBlocked } from '../middleware/prelaunch.js'

const router = Router()

router.get('/my', requireUser, async (req, res) => {
  const db = getDb()
  const member = await db.get('SELECT t.*, tm.role FROM team_members tm JOIN teams t ON t.id = tm.team_id WHERE tm.user_id = ?', [req.userId])
  if (!member) return res.json({ team: null, members: [] })
  const members = await db.all(
    `SELECT u.id, u.email, u.name, tm.role FROM team_members tm
     JOIN users u ON u.id = tm.user_id WHERE tm.team_id = ?`,
    [member.id]
  )
  res.json({ team: { id: member.id, name: member.name, inviteCode: member.invite_code, maxSeats: member.max_seats, role: member.role }, members })
})

router.post('/create', requireUser, async (req, res) => {
  const db = getDb()
  const name = String(req.body.name || 'Моя команда').trim()
  const inviteCode = crypto.randomBytes(6).toString('hex')
  const result = await db.get(
    'INSERT INTO teams (name, owner_id, invite_code, max_seats) VALUES (?, ?, ?, ?) RETURNING id',
    [name, req.userId, inviteCode, req.body.maxSeats || 10]
  )
  const teamId = result.id
  await db.run('INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)', [teamId, req.userId, 'owner'])
  await db.run('UPDATE users SET team_id = ? WHERE id = ?', [teamId, req.userId])
  res.status(201).json({ id: teamId, inviteCode })
})

router.post('/join', requireUser, async (req, res) => {
  const db = getDb()
  const code = String(req.body.inviteCode || '').trim()
  const team = await db.get('SELECT * FROM teams WHERE invite_code = ?', [code])
  if (!team) return res.status(404).json({ error: 'Team not found' })
  const countRow = await db.get('SELECT COUNT(*) AS n FROM team_members WHERE team_id = ?', [team.id])
  if (Number(countRow?.n || 0) >= team.max_seats) return res.status(400).json({ error: 'Team is full' })
  await db.run('INSERT OR IGNORE INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)', [team.id, req.userId, 'member'])
  await db.run('UPDATE users SET team_id = ? WHERE id = ?', [team.id, req.userId])
  res.json({ ok: true, teamId: team.id })
})

router.post('/grant-course', requireUser, prelaunchBlocked, (_req, res) => {
  res.status(501).json({
    error: 'Team course licensing is not enabled',
    errorRu: 'Командные лицензии пока не подключены. Доступ выдаёт администратор после оплаты.',
  })
})

export default router
