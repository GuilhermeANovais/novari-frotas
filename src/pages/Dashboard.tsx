import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Users, Car } from 'lucide-react';

export function Dashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  // Lista de departamentos fixa ou vinda do userProfile
  const allDepartments = ["SEMED", "SAUDE", "A. SOCIAL", "OBRAS", "GCM", "HGDO", "SEMASU", "PMM", "CONSELHO TUTELAR"];
  
  // Filtra departamentos baseados no perfil do utilizador
  const departmentsToShow = userProfile?.role === 'admin' 
    ? allDepartments 
    : userProfile?.departments || (userProfile?.department ? [userProfile.department] : []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold text-gray-700 mb-6">Departamentos</h2>
      
      {departmentsToShow.length === 0 ? (
        <p className="text-gray-500 text-center">Nenhum departamento associado ao seu perfil.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departmentsToShow.sort().map((dept) => (
            <div 
              key={dept}
              onClick={() => navigate(`/departamentos/${dept}`)}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:bg-green-50 transition-all cursor-pointer group"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-3 rounded-full group-hover:bg-green-200 transition-colors">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{dept}</h3>
                  <p className="text-sm text-gray-500 flex items-center mt-1">
                    <span className="flex items-center mr-3"><Car className="w-3 h-3 mr-1"/> Ver Frota</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
