import React, { useState, useEffect } from 'react';
import {
  getMasterWebsiteData,
  AuditActivityLog
} from '../../services/websiteContentService';
import { triggerFileDownload } from '../../utils/downloadUtils';

interface ActivityLogsModuleProps {
  onShowToast: (msg: string) => void;
}

export const ActivityLogsModule: React.FC<ActivityLogsModuleProps> = ({
  onShowToast
}) => {
  const [logs, setLogs] = useState<AuditActivityLog[]>([]);
  const [selectedModule, setSelectedModule] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDetailLog, setSelectedDetailLog] = useState<AuditActivityLog | null>(null);

  const pageSize = 8;

  useEffect(() => {
    const data = getMasterWebsiteData();
    setLogs(data.auditLogs);
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesModule = selectedModule === 'All' || log.module === selectedModule;
    const matchesSearch =
      !searchQuery ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesModule && matchesSearch;
  });

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const exportAuditLogsCsv = () => {
    const headers = ['Log ID', 'Timestamp', 'User', 'Role', 'Action', 'Module', 'Target', 'Details', 'IP Address', 'Status'];
    const rows = filteredLogs.map(l => [
      `"${l.id}"`,
      `"${l.timestamp}"`,
      `"${l.user.replace(/"/g, '""')}"`,
      `"${l.role}"`,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${l.module}"`,
      `"${l.target.replace(/"/g, '""')}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.ipAddress}"`,
      `"${l.status}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    triggerFileDownload(csvContent, `ALAM_ENGAZ_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8');
    onShowToast('✓ Exported audit trail log as CSV');
  };

  return (
    <div className="adm-module-wrap">
      {/* Module Header */}
      <div className="adm-module-header">
        <div>
          <div className="adm-module-eyebrow">SECURITY AUDIT &bull; COMPLIANCE LOG</div>
          <h2 className="adm-module-title">System Activity Logs</h2>
          <p className="adm-module-subtitle">
            Cryptographically signed, append-only administrative audit records tracking employee profile changes, CMS publishing, and role authentications.
          </p>
        </div>
        <div className="adm-module-header-actions">
          <button type="button" className="btn-adm-primary" onClick={exportAuditLogsCsv}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Export Audit Trail</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="adm-controls-bar" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 18px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="ss-input"
            placeholder="Search by action, user, or target..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{ width: '280px' }}
          />

          <div className="adm-filter-pills">
            {(['All', 'Employees', 'Signatures', 'Guides', 'Website', 'Media', 'Admin', 'Security'] as const).map(mod => (
              <button
                key={mod}
                type="button"
                className={`adm-filter-pill ${selectedModule === mod ? 'active' : ''}`}
                onClick={() => {
                  setSelectedModule(mod);
                  setCurrentPage(1);
                }}
              >
                {mod}
              </button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 600 }}>
          {filteredLogs.length} Records Found
        </div>
      </div>

      {/* Audit Table */}
      <div className="adm-table-card">
        <table className="ss-table">
          <thead>
            <tr>
              <th>Date &amp; Time</th>
              <th>User &amp; Role</th>
              <th>Action</th>
              <th>Module</th>
              <th>Target Entity</th>
              <th>IP / Session</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Inspection</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.map(log => (
              <tr key={log.id}>
                <td style={{ whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '11.5px' }}>
                  {log.timestamp}
                </td>
                <td>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{log.user}</div>
                  <span className="ss-badge-role" style={{ fontSize: '10px' }}>{log.role}</span>
                </td>
                <td style={{ fontWeight: 600 }}>{log.action}</td>
                <td>
                  <span className="adm-module-badge">{log.module}</span>
                </td>
                <td style={{ color: '#334155' }}>{log.target}</td>
                <td style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>
                  {log.ipAddress}
                </td>
                <td>
                  <span className="ss-badge-operational" style={{ padding: '2px 8px' }}>
                    <span className="ss-dot-green" />
                    {log.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    className="btn-adm-subaction"
                    onClick={() => setSelectedDetailLog(log)}
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid #F1F5F9' }}>
          <div style={{ fontSize: '12px', color: '#64748B' }}>
            Page {currentPage} of {totalPages}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-adm-subaction"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn-adm-subaction"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ================= MODAL: AUDIT LOG DETAILS ================= */}
      {selectedDetailLog && (
        <div className="ss-modal-overlay" onClick={() => setSelectedDetailLog(null)}>
          <div className="ss-modal-window" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
            <div className="ss-modal-header">
              <h3 className="ss-modal-title">Audit Record: {selectedDetailLog.id}</h3>
              <button className="ss-modal-close" onClick={() => setSelectedDetailLog(null)}>&times;</button>
            </div>
            <div className="ss-modal-body">
              <div className="ss-info-list">
                <div className="ss-info-row">
                  <span className="ss-info-label">Timestamp</span>
                  <span className="ss-info-value" style={{ fontFamily: 'monospace' }}>{selectedDetailLog.timestamp}</span>
                </div>
                <div className="ss-info-row">
                  <span className="ss-info-label">Authorized User</span>
                  <span className="ss-info-value">{selectedDetailLog.user} ({selectedDetailLog.role})</span>
                </div>
                <div className="ss-info-row">
                  <span className="ss-info-label">Action Performed</span>
                  <span className="ss-info-value">{selectedDetailLog.action}</span>
                </div>
                <div className="ss-info-row">
                  <span className="ss-info-label">Module Classification</span>
                  <span className="ss-info-value">{selectedDetailLog.module}</span>
                </div>
                <div className="ss-info-row">
                  <span className="ss-info-label">Target Entity</span>
                  <span className="ss-info-value">{selectedDetailLog.target}</span>
                </div>
                <div className="ss-info-row">
                  <span className="ss-info-label">Network / Session IP</span>
                  <span className="ss-info-value" style={{ fontFamily: 'monospace' }}>{selectedDetailLog.ipAddress}</span>
                </div>
                <div className="ss-info-row">
                  <span className="ss-info-label">Verification Status</span>
                  <span className="ss-info-value" style={{ color: '#059669', fontWeight: 700 }}>{selectedDetailLog.status}</span>
                </div>
              </div>

              <div style={{ marginTop: '16px', background: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <strong style={{ fontSize: '12px', color: '#0F172A', display: 'block', marginBottom: '4px' }}>Audited Event Details:</strong>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#475569', lineHeight: 1.5 }}>
                  {selectedDetailLog.details}
                </p>
              </div>
            </div>
            <div className="ss-modal-footer">
              <button type="button" className="ss-btn-cancel" onClick={() => setSelectedDetailLog(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
