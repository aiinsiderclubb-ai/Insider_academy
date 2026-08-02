export async function enforceGovernanceRetention(db) {
  const days = Math.max(30, Number(process.env.GOVERNANCE_RETENTION_DAYS || 365))
  const cutoff = new Date(Date.now() - days * 86400_000).toISOString()
  await db.run('DELETE FROM deployment_events WHERE created_at < ?', [cutoff])
  await db.run('DELETE FROM marketplace_events WHERE created_at < ?', [cutoff])
  await db.run(
    `UPDATE incidents SET description = '[redacted after retention period]'
     WHERE created_at < ? AND status = 'resolved' AND description IS NOT NULL`,
    [cutoff]
  )
}
