import { Link } from 'react-router-dom';
import EtatVide from '../../composants/ui/EtatVide';

export default function NotFound() {
  return (
    <div className="not-found-wrapper">
      <div>
        <EtatVide
          icon="search_off"
          title="Page introuvable"
          description="La page que vous cherchez n'existe pas ou a été déplacée."
        />
        <div className="not-found-action">
          <Link to="/hub" className="text-label not-found-link">
            Retour à l'accueil du scrutin
          </Link>
        </div>
      </div>
    </div>
  );
}
