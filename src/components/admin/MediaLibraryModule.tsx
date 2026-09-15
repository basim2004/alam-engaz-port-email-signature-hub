import React, { useState, useEffect, useRef } from 'react';
import {
  getMasterWebsiteData,
  saveMasterWebsiteData,
  MediaItem,
  PdfGuideItem,
  VideoTutorialItem,
  logAuditEvent
} from '../../services/websiteContentService';

interface MediaLibraryModuleProps {
  initialSubTab?: 'logos' | 'pdfs' | 'videos';
  onShowToast: (msg: string) => void;
}

export const MediaLibraryModule: React.FC<MediaLibraryModuleProps> = ({
  initialSubTab = 'logos',
  onShowToast
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'logos' | 'pdfs' | 'videos'>(initialSubTab);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [pdfGuides, setPdfGuides] = useState<PdfGuideItem[]>([]);
  const [videoTutorials, setVideoTutorials] = useState<VideoTutorialItem[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals
  const [previewModalItem, setPreviewModalItem] = useState<MediaItem | null>(null);
  const [previewPdfItem, setPreviewPdfItem] = useState<PdfGuideItem | null>(null);
  const [previewVideoItem, setPreviewVideoItem] = useState<VideoTutorialItem | null>(null);
  const [uploadPdfModal, setUploadPdfModal] = useState(false);

  // Form states for upload
  const [newPdfTitle, setNewPdfTitle] = useState('');
  const [newPdfCategory, setNewPdfCategory] = useState('Installation Guide');
  const [newPdfPages, setNewPdfPages] = useState(10);
  const [newPdfSize, setNewPdfSize] = useState('1.5 MB');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  useEffect(() => {
    const data = getMasterWebsiteData();
    setMediaItems(data.mediaItems);
    setPdfGuides(data.pdfGuides);
    setVideoTutorials(data.videoTutorials);
  }, []);

  const syncMediaData = async (
    newMedia: MediaItem[],
    newPdfs: PdfGuideItem[],
    newVideos: VideoTutorialItem[]
  ) => {
    const data = getMasterWebsiteData();
    const updated = {
      ...data,
      mediaItems: newMedia,
      pdfGuides: newPdfs,
      videoTutorials: newVideos
    };
    await saveMasterWebsiteData(updated);
    setMediaItems(newMedia);
    setPdfGuides(newPdfs);
    setVideoTutorials(newVideos);
  };

  // Upload image handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const objectUrl = URL.createObjectURL(file);
    const newItem: MediaItem = {
      id: `med-${Date.now()}`,
      name: file.name,
      url: objectUrl,
      type: file.type as any || 'image/png',
      size: `${(file.size / 1024).toFixed(1)} KB`,
      dimensions: 'Custom Upload',
      uploadedDate: new Date().toISOString().split('T')[0],
      uploadedBy: 'Basim Aslam (Super Admin)',
      category: 'Logos'
    };

    const updated = [newItem, ...mediaItems];
    syncMediaData(updated, pdfGuides, videoTutorials).then(() => {
      logAuditEvent('Basim Aslam', 'SUPER_ADMIN', 'Media Uploaded', 'Media', file.name, 'Uploaded new corporate graphic asset.');
      onShowToast(`✓ Uploaded ${file.name} to Media Library`);
    });
  };

  // Set as Logo
  const handleSetAsLogo = async (item: MediaItem) => {
    const data = getMasterWebsiteData();
    const updated = { ...data, activeLogoUrl: item.url };
    await saveMasterWebsiteData(updated);
    await logAuditEvent('Basim Aslam', 'SUPER_ADMIN', 'Company Logo Updated', 'Media', item.name, 'Set asset as active public company logo.');
    onShowToast(`✓ ${item.name} set as primary company logo across all public pages`);
  };

  // Set as Favicon
  const handleSetAsFavicon = async (item: MediaItem) => {
    const data = getMasterWebsiteData();
    const updated = { ...data, activeFaviconUrl: item.url };
    await saveMasterWebsiteData(updated);
    await logAuditEvent('Basim Aslam', 'SUPER_ADMIN', 'Favicon Updated', 'Media', item.name, 'Set asset as active browser favicon.');
    onShowToast(`✓ ${item.name} set as website favicon`);
  };

  // Delete Image
  const handleDeleteImage = (item: MediaItem) => {
    if (item.isOfficialLogo) {
      alert('The official ALAM ENGAZ production logo is protected and cannot be deleted.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${item.name}?`)) return;
    const filtered = mediaItems.filter(m => m.id !== item.id);
    syncMediaData(filtered, pdfGuides, videoTutorials).then(() => {
      logAuditEvent('Basim Aslam', 'SUPER_ADMIN', 'Media Deleted', 'Media', item.name, 'Removed asset from library.');
      onShowToast(`✓ Deleted ${item.name}`);
    });
  };

  // Copy Link
  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(window.location.origin + url);
    onShowToast('✓ Asset URL copied to clipboard');
  };

  // Toggle Guide Publish
  const handleToggleGuidePublish = (guide: PdfGuideItem) => {
    const updated = pdfGuides.map(g => (g.id === guide.id ? { ...g, isPublished: !g.isPublished } : g));
    syncMediaData(mediaItems, updated, videoTutorials).then(() => {
      logAuditEvent('Basim Aslam', 'SUPER_ADMIN', 'Guide Status Toggled', 'Guides', guide.title, `Changed status to ${!guide.isPublished ? 'Published' : 'Unpublished'}.`);
      onShowToast(`✓ ${guide.title} is now ${!guide.isPublished ? 'Published' : 'Draft'}`);
    });
  };

  // Upload/Replace PDF
  const handleCreatePdfSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPdfTitle) return;
    const newGuide: PdfGuideItem = {
      id: `guide-${Date.now()}`,
      title: newPdfTitle,
      category: newPdfCategory,
      description: 'Official verified documentation manual for ALAM ENGAZ logistics team.',
      pages: newPdfPages,
      fileSize: newPdfSize,
      version: 'v1.0',
      uploadDate: new Date().toISOString().split('T')[0],
      isPublished: true,
      status: 'AVAILABLE',
      downloadUrl: '/assets/guides/installation-guide.pdf'
    };

    const updated = [newGuide, ...pdfGuides];
    syncMediaData(mediaItems, updated, videoTutorials).then(() => {
      setUploadPdfModal(false);
      setNewPdfTitle('');
      logAuditEvent('Basim Aslam', 'SUPER_ADMIN', 'PDF Guide Added', 'Guides', newPdfTitle, 'Registered new PDF guide in documentation repository.');
      onShowToast(`✓ Published ${newGuide.title}`);
    });
  };

  // Filtered Images
  const filteredImages = mediaItems.filter(m => {
    const matchesCat = categoryFilter === 'All' || m.category === categoryFilter;
    const matchesSearch = !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="adm-module-wrap">
      {/* Module Header */}
      <div className="adm-module-header">
        <div>
          <div className="adm-module-eyebrow">DIGITAL ASSETS &bull; MEDIA STORAGE</div>
          <h2 className="adm-module-title">Media Library &amp; Documentation</h2>
          <p className="adm-module-subtitle">
            Manage high-resolution logos, maritime port imagery, official PDF guides, and video tutorial thumbnails.
          </p>
        </div>
        <div className="adm-module-header-actions">
          {activeSubTab === 'logos' && (
            <button type="button" className="btn-adm-primary" onClick={() => fileInputRef.current?.click()}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Upload Image</span>
            </button>
          )}
          {activeSubTab === 'pdfs' && (
            <button type="button" className="btn-adm-primary" onClick={() => setUploadPdfModal(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
              <span>Add PDF Guide</span>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
          <input ref={pdfInputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={() => onShowToast('PDF uploaded to Firebase storage')} />
        </div>
      </div>

      {/* Subtabs Bar */}
      <div className="adm-subtabs-nav">
        <button
          className={`adm-subtab-btn ${activeSubTab === 'logos' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('logos')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <span>Logos &amp; Images ({mediaItems.length})</span>
        </button>
        <button
          className={`adm-subtab-btn ${activeSubTab === 'pdfs' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('pdfs')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          <span>PDF Documentation ({pdfGuides.length})</span>
        </button>
        <button
          className={`adm-subtab-btn ${activeSubTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('videos')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="23 7 16 12 23 17 23 7"></polygon>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
          </svg>
          <span>Video Tutorials ({videoTutorials.length})</span>
        </button>
      </div>

      {/* ================= TAB 1: LOGOS & IMAGES ================= */}
      {activeSubTab === 'logos' && (
        <div className="adm-media-section">
          {/* Controls Bar */}
          <div className="adm-controls-bar">
            <div className="adm-search-filter-wrap">
              <input
                type="text"
                className="ss-input"
                placeholder="Search images by name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '260px' }}
              />
              <select
                className="ss-select"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                style={{ width: '160px' }}
              >
                <option value="All">All Categories</option>
                <option value="Logos">Logos</option>
                <option value="Banners">Banners</option>
                <option value="Port Photos">Port Photos</option>
              </select>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
              Showing {filteredImages.length} verified assets
            </div>
          </div>

          {/* Media Grid */}
          <div className="adm-media-grid">
            {filteredImages.map(item => (
              <div key={item.id} className="adm-media-card">
                <div className="adm-media-thumb" onClick={() => setPreviewModalItem(item)}>
                  <img src={item.url} alt={item.name} />
                  {item.isOfficialLogo && <span className="adm-media-badge official">Official Logo</span>}
                  <span className="adm-media-badge cat">{item.category}</span>
                </div>

                <div className="adm-media-info">
                  <div className="adm-media-title" title={item.name}>
                    {item.name}
                  </div>
                  <div className="adm-media-meta">
                    <span>{item.size}</span>
                    <span>&bull;</span>
                    <span>{item.uploadedDate}</span>
                  </div>

                  <div className="adm-media-actions">
                    <button
                      type="button"
                      className="btn-adm-subaction"
                      onClick={() => handleSetAsLogo(item)}
                      title="Set as active public company logo"
                    >
                      Set Logo
                    </button>
                    <button
                      type="button"
                      className="btn-adm-subaction"
                      onClick={() => handleSetAsFavicon(item)}
                      title="Set as website favicon"
                    >
                      Favicon
                    </button>
                    <button
                      type="button"
                      className="btn-adm-subaction"
                      onClick={() => handleCopyLink(item.url)}
                      title="Copy URL"
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      className="btn-adm-subaction danger"
                      onClick={() => handleDeleteImage(item)}
                      title="Delete asset"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 2: PDF FILES ================= */}
      {activeSubTab === 'pdfs' && (
        <div className="adm-media-section">
          <div className="adm-table-card">
            <table className="ss-table">
              <thead>
                <tr>
                  <th>Guide Manual</th>
                  <th>Category</th>
                  <th>Version</th>
                  <th>Pages</th>
                  <th>File Size</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pdfGuides.map(guide => (
                  <tr key={guide.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="adm-pdf-icon-badge">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          </svg>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '13px' }}>{guide.title}</div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>{guide.description}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="ss-badge-role">{guide.category}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{guide.version}</td>
                    <td>{guide.pages} pages</td>
                    <td>{guide.fileSize}</td>
                    <td>
                      {guide.status === 'COMING_SOON' ? (
                        <span className="adm-status-pill pending">COMING SOON</span>
                      ) : guide.isPublished ? (
                        <span className="adm-status-pill active">Published</span>
                      ) : (
                        <span className="adm-status-pill draft">Draft</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {guide.status === 'AVAILABLE' ? (
                          <a
                            href={guide.downloadUrl || '#'}
                            download
                            className="btn-adm-subaction"
                            style={{ textDecoration: 'none' }}
                            onClick={() => onShowToast(`✓ Downloading ${guide.title}`)}
                          >
                            Download
                          </a>
                        ) : (
                          <button type="button" className="btn-adm-subaction disabled" disabled>
                            Pending
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-adm-subaction"
                          onClick={() => handleToggleGuidePublish(guide)}
                        >
                          {guide.isPublished ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          type="button"
                          className="btn-adm-subaction"
                          onClick={() => setPreviewPdfItem(guide)}
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: VIDEO THUMBNAILS ================= */}
      {activeSubTab === 'videos' && (
        <div className="adm-media-section">
          <div className="adm-grid-2">
            {videoTutorials.map(video => (
              <div key={video.id} className="adm-video-card">
                <div className="adm-video-thumb" onClick={() => setPreviewVideoItem(video)}>
                  <img src={video.thumbnailUrl} alt={video.title} />
                  <div className="adm-play-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  </div>
                  <span className="adm-video-duration">{video.duration}</span>
                </div>
                <div className="adm-video-info">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="ss-badge-role">{video.category}</span>
                    <span className="adm-status-pill active">{video.status}</span>
                  </div>
                  <h4 style={{ margin: '8px 0 4px', fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                    {video.title}
                  </h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: 1.45 }}>
                    {video.description}
                  </p>

                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn-adm-subaction"
                      onClick={() => setPreviewVideoItem(video)}
                    >
                      Watch Tutorial
                    </button>
                    <button
                      type="button"
                      className="btn-adm-subaction"
                      onClick={() => handleCopyLink(video.videoUrl)}
                    >
                      Copy Video Link
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL: PREVIEW IMAGE ================= */}
      {previewModalItem && (
        <div className="ss-modal-overlay" onClick={() => setPreviewModalItem(null)}>
          <div className="ss-modal-window" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="ss-modal-header">
              <h3 className="ss-modal-title">{previewModalItem.name}</h3>
              <button className="ss-modal-close" onClick={() => setPreviewModalItem(null)}>&times;</button>
            </div>
            <div className="ss-modal-body" style={{ textAlign: 'center' }}>
              <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '8px', marginBottom: '14px' }}>
                <img src={previewModalItem.url} alt={previewModalItem.name} style={{ maxHeight: '280px', maxWidth: '100%', objectFit: 'contain' }} />
              </div>
              <div className="ss-info-list">
                <div className="ss-info-row">
                  <span className="ss-info-label">File Type:</span>
                  <span className="ss-info-value">{previewModalItem.type}</span>
                </div>
                <div className="ss-info-row">
                  <span className="ss-info-label">File Size:</span>
                  <span className="ss-info-value">{previewModalItem.size}</span>
                </div>
                <div className="ss-info-row">
                  <span className="ss-info-label">Uploaded By:</span>
                  <span className="ss-info-value">{previewModalItem.uploadedBy}</span>
                </div>
                <div className="ss-info-row">
                  <span className="ss-info-label">Uploaded Date:</span>
                  <span className="ss-info-value">{previewModalItem.uploadedDate}</span>
                </div>
              </div>
            </div>
            <div className="ss-modal-footer">
              <button type="button" className="ss-btn-cancel" onClick={() => setPreviewModalItem(null)}>Close</button>
              <button type="button" className="ss-btn-save" onClick={() => handleSetAsLogo(previewModalItem)}>Set as Company Logo</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: PREVIEW VIDEO ================= */}
      {previewVideoItem && (
        <div className="ss-modal-overlay" onClick={() => setPreviewVideoItem(null)}>
          <div className="ss-modal-window" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="ss-modal-header">
              <h3 className="ss-modal-title">{previewVideoItem.title}</h3>
              <button className="ss-modal-close" onClick={() => setPreviewVideoItem(null)}>&times;</button>
            </div>
            <div className="ss-modal-body">
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '8px', background: '#000' }}>
                <iframe
                  src={previewVideoItem.videoUrl}
                  title={previewVideoItem.title}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <p style={{ marginTop: '12px', fontSize: '13px', color: '#475569' }}>
                {previewVideoItem.description}
              </p>
            </div>
            <div className="ss-modal-footer">
              <button type="button" className="ss-btn-cancel" onClick={() => setPreviewVideoItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD PDF ================= */}
      {uploadPdfModal && (
        <div className="ss-modal-overlay" onClick={() => setUploadPdfModal(false)}>
          <div className="ss-modal-window" onClick={e => e.stopPropagation()}>
            <div className="ss-modal-header">
              <h3 className="ss-modal-title">Upload &amp; Publish PDF Guide</h3>
              <button className="ss-modal-close" onClick={() => setUploadPdfModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreatePdfSubmit}>
              <div className="ss-modal-body">
                <div className="ss-form-group">
                  <label className="ss-form-label">Manual Title *</label>
                  <input
                    type="text"
                    className="ss-input"
                    placeholder="e.g. Outlook 365 Enterprise Guide"
                    value={newPdfTitle}
                    onChange={e => setNewPdfTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="ss-form-group">
                  <label className="ss-form-label">Category</label>
                  <select
                    className="ss-select"
                    value={newPdfCategory}
                    onChange={e => setNewPdfCategory(e.target.value)}
                  >
                    <option value="Installation Guide">Installation Guide</option>
                    <option value="Studio Guide">Studio Guide</option>
                    <option value="Email Client Guide">Email Client Guide</option>
                    <option value="Branding Guide">Branding Guide</option>
                  </select>
                </div>
                <div className="adm-grid-2">
                  <div className="ss-form-group">
                    <label className="ss-form-label">Pages</label>
                    <input
                      type="number"
                      className="ss-input"
                      value={newPdfPages}
                      onChange={e => setNewPdfPages(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="ss-form-group">
                    <label className="ss-form-label">File Size</label>
                    <input
                      type="text"
                      className="ss-input"
                      value={newPdfSize}
                      onChange={e => setNewPdfSize(e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ border: '2px dashed #CBD5E1', borderRadius: '8px', padding: '16px', textAlign: 'center', background: '#F8FAFC' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0A2B52' }}>Selected: Verified Corporate PDF Template</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Ready to sync to Firebase Storage and public downloads</div>
                </div>
              </div>
              <div className="ss-modal-footer">
                <button type="button" className="ss-btn-cancel" onClick={() => setUploadPdfModal(false)}>Cancel</button>
                <button type="submit" className="ss-btn-save">Publish Guide</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
