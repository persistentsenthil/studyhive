export default function DocumentCard({ doc, showSubject = false }) {
  const { deleteDocument, user } = useApp()
  const isOwner = user?.name === doc.uploaded_by

  return (
    <div className="doc-card card fade-in">
      {/* ... header and body ... */}
      <div className="doc-card-footer">
        <span className="doc-uploader">by {doc.uploaded_by || 'User'}</span>
        {isOwner && (
          <button className="btn btn-ghost doc-delete" onClick={handleDelete} title="Delete">
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  )
}