import { useEffect, useState } from 'react'
import { api } from '../api/client'
import styles from '../pages/Cabinet.module.css'

export function GovernanceDashboard({ lang = 'ru' }) {
  const ru = lang === 'ru'
  const [dashboard, setDashboard] = useState(null)
  const [suites, setSuites] = useState([])
  const [available, setAvailable] = useState(true)
  const [error, setError] = useState('')

  const refresh = async () => {
    try {
      const [data, evalSuites] = await Promise.all([
        api.governanceDashboard(),
        api.governanceEvalSuites(),
      ])
      setDashboard(data)
      setSuites(evalSuites)
    } catch (err) {
      if (err.status === 403 || err.status === 404) setAvailable(false)
      else setError(err.message)
    }
  }

  useEffect(() => { refresh() }, [])
  if (!available || !dashboard) return null

  const runEval = async (deployment) => {
    const suite = suites.find((item) => item.productId === deployment.productId)
    if (!suite) return
    setError('')
    try {
      await api.runGovernanceEval(suite.id, deployment.id)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  const reportIncident = async (deployment) => {
    setError('')
    try {
      await api.createIncident({
        deploymentId: deployment.id,
        severity: 'medium',
        title: `Deployment ${deployment.id} requires investigation`,
      })
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{ru ? 'Agent Monitoring & Governance' : 'Agent Monitoring & Governance'}</h2>
      <p className={styles.sectionDesc}>
        {ru ? 'Beta для Agency: deploy, eval и incident workflow без чувствительных payload.' : 'Agency beta: deploy, eval and incident workflows without sensitive payloads.'}
      </p>
      {error && <p role="alert" className={styles.muted}>{error}</p>}
      <div className={styles.cards}>
        <article className={styles.card}><h3>{dashboard.summary.healthy}</h3><p>{ru ? 'Успешных deploy' : 'Healthy deploys'}</p></article>
        <article className={styles.card}><h3>{dashboard.summary.failed}</h3><p>{ru ? 'Ошибок deploy' : 'Failed deploys'}</p></article>
        <article className={styles.card}><h3>{dashboard.summary.evalPassRate ?? '—'}%</h3><p>Eval pass rate</p></article>
        <article className={styles.card}><h3>{dashboard.summary.openIncidents}</h3><p>{ru ? 'Открытых инцидентов' : 'Open incidents'}</p></article>
      </div>
      <div className={styles.cards}>
        {dashboard.deployments.map((deployment) => (
          <article className={styles.card} key={deployment.id}>
            <h3>{deployment.productId}</h3>
            <p>{deployment.status} · {deployment.latencyMs == null ? '—' : `${deployment.latencyMs} ms`}</p>
            {suites.some((suite) => suite.productId === deployment.productId) && (
              <button type="button" onClick={() => runEval(deployment)}>{ru ? 'Запустить eval' : 'Run eval'}</button>
            )}
            <button type="button" onClick={() => reportIncident(deployment)}>{ru ? 'Создать инцидент' : 'Report incident'}</button>
          </article>
        ))}
      </div>
    </section>
  )
}
