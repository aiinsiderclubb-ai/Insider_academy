import { useEffect, useState } from 'react'
import { api } from '../api/client'
import styles from '../pages/Cabinet.module.css'

export function N8nDeployPanel({ products = [], lang = 'ru' }) {
  const ru = lang === 'ru'
  const [connections, setConnections] = useState([])
  const [deployments, setDeployments] = useState([])
  const [instanceUrl, setInstanceUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [selectedConnection, setSelectedConnection] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.productId || '')
  const [preview, setPreview] = useState(null)
  const [credentialMapping, setCredentialMapping] = useState('{}')
  const [error, setError] = useState('')
  const [available, setAvailable] = useState(true)

  const refresh = async () => {
    try {
      const [nextConnections, nextDeployments] = await Promise.all([
        api.getN8nConnections(),
        api.getN8nDeployments(),
      ])
      setConnections(nextConnections)
      setDeployments(nextDeployments)
      if (!selectedConnection && nextConnections[0]) setSelectedConnection(nextConnections[0].id)
    } catch (err) {
      if (err.status === 404) setAvailable(false)
      else setError(err.message)
    }
  }

  useEffect(() => { refresh() }, [])
  useEffect(() => {
    if (!selectedProduct && products[0]) setSelectedProduct(products[0].productId)
  }, [products, selectedProduct])

  const connect = async (event) => {
    event.preventDefault()
    setError('')
    try {
      await api.connectN8n({ instanceUrl, apiKey })
      setApiKey('')
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  const inspect = async () => {
    setError('')
    try {
      setPreview(await api.previewN8nDeploy({ productId: selectedProduct, connectionId: selectedConnection }))
    } catch (err) {
      setError(err.message)
    }
  }

  const deploy = async () => {
    setError('')
    try {
      const mapping = JSON.parse(credentialMapping || '{}')
      await api.deployToN8n({
        productId: selectedProduct,
        connectionId: selectedConnection,
        credentialMapping: mapping,
      })
      setPreview(null)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!available) return null

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{ru ? 'One-click deploy в n8n' : 'One-click n8n deploy'}</h2>
      <p className={styles.sectionDesc}>
        {ru
          ? 'API-ключ шифруется. Перед импортом проверьте узлы, credentials и diff.'
          : 'Your API key is encrypted. Review nodes, credentials and the diff before importing.'}
      </p>
      {error && <p className={styles.muted} role="alert">{error}</p>}
      {connections.length === 0 ? (
        <form onSubmit={connect} className={styles.cards}>
          <label>
            n8n URL
            <input value={instanceUrl} onChange={(event) => setInstanceUrl(event.target.value)} placeholder="https://n8n.example.com" required />
          </label>
          <label>
            API key
            <input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} required />
          </label>
          <button type="submit">{ru ? 'Подключить и проверить' : 'Connect and test'}</button>
        </form>
      ) : (
        <>
          <div className={styles.cards}>
            <select value={selectedConnection} onChange={(event) => setSelectedConnection(event.target.value)}>
              {connections.map((connection) => (
                <option key={connection.id} value={connection.id}>{connection.instanceUrl}</option>
              ))}
            </select>
            <select value={selectedProduct} onChange={(event) => setSelectedProduct(event.target.value)}>
              {products.map((product) => (
                <option key={product.productId} value={product.productId}>{product.title}</option>
              ))}
            </select>
            <button type="button" onClick={inspect} disabled={!selectedProduct}>{ru ? 'Проверить импорт' : 'Review import'}</button>
          </div>
          {preview && (
            <div className={styles.card}>
              <h3>{preview.diff.workflowName} · v{preview.version}</h3>
              <p>{ru ? 'Узлы' : 'Nodes'}: {preview.diff.nodeCount}</p>
              <p>{ru ? 'Требуемые типы узлов' : 'Required node types'}: {(preview.requiredNodes || []).join(', ') || '—'}</p>
              <p>{ru ? 'Credentials' : 'Credentials'}: {(preview.requiredCredentials || []).map((item) => item.key).join(', ') || '—'}</p>
              <textarea
                value={credentialMapping}
                onChange={(event) => setCredentialMapping(event.target.value)}
                aria-label="Credential mapping JSON"
                rows={3}
              />
              <button type="button" onClick={deploy}>{ru ? 'Подтвердить deploy' : 'Confirm deploy'}</button>
            </div>
          )}
          {deployments.length > 0 && (
            <div className={styles.cards}>
              {deployments.map((deployment) => (
                <article className={styles.card} key={deployment.id}>
                  <h3>{deployment.productId}</h3>
                  <p>{deployment.status}{deployment.errorCode ? ` · ${deployment.errorCode}` : ''}</p>
                  {deployment.status === 'failed' && (
                    <button type="button" onClick={() => api.retryN8nDeploy(deployment.id).then(refresh)}>
                      {ru ? 'Повторить' : 'Retry'}
                    </button>
                  )}
                  {deployment.status === 'succeeded' && (
                    <button type="button" onClick={() => api.rollbackN8nDeploy(deployment.id).then(refresh)}>
                      Rollback
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
