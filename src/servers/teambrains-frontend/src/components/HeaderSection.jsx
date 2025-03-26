import man from "../assets/man-header-section.png"

const HeaderSection = () => {
    return (
        // Conteneur principal avec dégradé vert et adaptation responsive (colonne sur mobile, ligne sur desktop)
        <div className="flex flex-col md:flex-row bg-gradient-to-r from-customGreenStart to-customGreenEnd text-white overflow-hidden">
            {/* Section texte et boutons - centrée sur mobile, alignée à gauche sur desktop */}
            <div className="py-10 md:py-20 px-6 md:ml-12 lg:ml-36 w-full md:w-2/3 text-center md:text-left">
                {/* Titre principal avec taille adaptative selon l'écran */}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-poppins">Collaborer et entreprendre</h1>

                {/* Sous-titre */}
                <p className="font-montserrat font-medium mt-2">Le meilleur endroit pour démarrer vos projets et vous challengez !</p>

                {/* Conteneur des boutons - centrés sur mobile, alignés à gauche sur desktop */}
                <div className="flex justify-center md:justify-start mt-4">
                    {/* Bouton principal blanc */}
                    <button onClick={() => window.location.href = '/projets'} className="bg-white py-1 px-4 text-green-tb rounded mr-2">Découvrir</button>

                    {/* Bouton secondaire avec bordure */}
                    <button onClick={() => window.location.href = '/contact'} className="border-2 py-1 px-4 text-white rounded mr-2">Contact</button>
                </div>
            </div>

            {/* Section image - centrée sur mobile, alignée à droite sur desktop */}
            <div className="w-full md:w-1/3 flex justify-center md:justify-end md:mr-12 lg:mr-36 md:flex-col">
                {/* Image de l'homme avec effet d'ombre lumineuse et taille responsive */}
                <img
                    src={man}
                    alt="Logo"
                    className="h-64 w-64 md:h-72 md:w-72 lg:h-80 lg:w-80 mb-4 md:mb-0"
                    style={{ filter: 'drop-shadow(0px 0px 140px #ffffff)' }}
                />
            </div>
        </div>
    );
};

export default HeaderSection;