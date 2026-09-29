import { useAuth } from '../../contextes/ContexteAuth';
import { useTableauBordAdmin } from '../../hooks/useTableauBordAdmin';
import { PageSpinner } from '../../composants/ui/Squelette';
import AdminHeader from '../../composants/administrateur/En_teteAdmin';
import AdminNavTabs from '../../composants/administrateur/OngletsNavAdmin';
import ScrutinConfigPanel from '../../composants/administrateur/PanneauConfigScrutin';
import ElectoralListPanel from '../../composants/administrateur/PanneauListeElectorale';
import ProjectApprovalWorkflow from '../../composants/administrateur/FluxApprobationProjet';
import ElectionResultsPanel from '../../composants/administrateur/PanneauResultatsScrutin';
import UrneExportPanel from '../../composants/administrateur/PanneauExportUrne';

export default function Admin() {
  const { user } = useAuth();
  const {
    activeTab,
    setActiveTab,
    loading,
    scrutin,
    electoralList,
    projects,
    savingScrutin,
    importing,
    moderating,
    exportingUrne,
    publishing,
    formScrutin,
    setFormScrutin,
    handleSaveScrutin,
    handleImportFromDropzone,
    handleModerate,
    handleTogglePublish,
    handleExportUrne,
  } = useTableauBordAdmin();

  if (loading) return <PageSpinner label="Chargement de l’espace Administrateur…" />;

  const pendingProjectsCount = projects.filter((p) => p.statut === 'en_attente' || p.statut === 'PENDING').length;

  return (
    <div className="admin-page" style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: 'var(--space-2xl)' }}>
      <AdminHeader user={user} />
      <AdminNavTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        electoralCount={electoralList.length}
        pendingProjectsCount={pendingProjectsCount}
      />

      {activeTab === 'scrutin' && (
        <ScrutinConfigPanel
          formScrutin={formScrutin}
          setFormScrutin={setFormScrutin}
          savingScrutin={savingScrutin}
          onSaveScrutin={handleSaveScrutin}
        />
      )}
      {activeTab === 'liste' && (
        <ElectoralListPanel
          electoralList={electoralList}
          importing={importing}
          onImportSuccess={handleImportFromDropzone}
        />
      )}
      {activeTab === 'projets' && (
        <ProjectApprovalWorkflow
          projects={projects}
          onModerate={handleModerate}
          moderating={moderating}
          adminUser={user}
        />
      )}
      {activeTab === 'resultats' && (
        <ElectionResultsPanel
          scrutin={scrutin}
          projects={projects}
          publishing={publishing}
          onTogglePublish={handleTogglePublish}
        />
      )}
      {activeTab === 'urne' && (
        <UrneExportPanel
          exportingUrne={exportingUrne}
          onExportUrne={handleExportUrne}
        />
      )}
    </div>
  );
}
