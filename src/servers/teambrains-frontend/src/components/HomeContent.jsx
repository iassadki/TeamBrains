import React from 'react';
import image1 from "../assets/image1.jpg";
import image2 from "../assets/image2.jpg";
import image3 from "../assets/image3.jpg";
import { Zap } from 'lucide-react';
import { useModal } from '../context/ModalContext';

const HomeContent = () => {
    const { openSignUpModal } = useModal();
    return (
        <div>
            {/* Section principale présentant TeamBrains */}
            <div className="mx-4 md:mx-12 lg:mx-36 pb-4 border-b">
                <div className="text-green-tb text-xl mt-8 font-medium font-poppins text-center md:text-left">
                    <p className="md:pl-8 text-[1.3rem] md:text-[1.5rem]">TeamBrains qu'est ce que c'est ?</p>
                </div>

                <div className="flex flex-col md:flex-row">
                    {/* Image de présentation */}
                    <div className="w-full md:w-1/2 p-4 md:p-8">
                        <img src={image1} alt="Une scène en intérieur montrant quatre personnes dans un espace de travail moderne. Deux personnes au premier plan se serrent la main - une personne portant un pull beige à gauche et une personne avec des cheveux bouclés courts et des lunettes portant un blazer beige à droite. Deux autres personnes regardent la poignée de main avec des expressions positives. L'ambiance semble professionnelle et amicale." className="rounded w-full" />
                    </div>

                    {/* Texte de présentation et bouton */}
                    <div className="w-full md:w-1/2 p-4 md:p-8 my-auto">
                        <div>
                            <p className="font-montserrat">TeamBrains est une plateforme de mise en relation entre des entrepreneurs et des développeurs étudiants/apprenants. Ensemble, nous faisons naître des prototypes web et logiciels innovants.</p>
                        </div>
                        <div className="mt-4 flex justify-center md:justify-start">
                            <button 
                                onClick={openSignUpModal}
                                className="bg-green-tb py-2 px-4 text-white rounded mr-2 cursor-pointer"
                            >
                                Nous rejoindre
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section des bénéfices */}
            <div className="mx-4 md:mx-12 lg:mx-36">
                <div className="text-green-tb text-xl mt-8 font-medium font-poppins text-center md:text-left">
                    <p className="md:pl-8 text-[1.3rem] md:text-[1.5rem]">Quels bénéfices ?</p>
                </div>

                <div className="flex flex-col md:flex-row justify-center p-4 md:p-8">
                    {/* Bénéfices pour les étudiants */}
                    <div className="flex flex-col justify-center items-center mb-8 md:mb-0">
                        <div>
                            <img src={image2} alt="Une personne assise sur un canapé en cuir noir dans un espace avec un mur de briques rouges. La personne porte une veste en jean bleu clair, des lunettes rondes, a des cheveux courts et un écouteur sans fil dans l'oreille. Elle semble concentrée sur quelque chose hors champ, probablement un ordinateur portable." className="w-48 md:w-56 rounded-[32px]" />
                        </div>
                        <div className="font-montserrat font-semibold text-lg mt-4">
                            <p>Étudiants</p>
                        </div>
                        <div className="px-4">
                            <p className="mt-2 text-center">Challengez vous et acquérez de l'expérience en travaillant en équipe sur des projets concrets et réels.</p>
                        </div>
                    </div>

                    {/* Icône de connexion entre les deux profils */}
                    <div className="flex justify-center my-4 md:mt-24 md:mx-4">
                        <Zap size={42} color="#00C673" />
                    </div>

                    {/* Bénéfices pour les entrepreneurs */}
                    <div className="flex flex-col justify-center items-center">
                        <div>
                            <img src={image3} alt="Une personne avec des cheveux longs attachés en chignon, portant un costume noir formel, une chemise blanche et une cravate. Elle porte des écouteurs noirs et écrit dans un carnet avec un stylo vert. L'arrière-plan montre des étagères avec des livres et des plantes, suggérant un environnement de travail." className="w-48 md:w-56 rounded-[32px]" />
                        </div>

                        <div>
                            <p className="font-montserrat font-semibold text-lg mt-4">Entrepreneurs</p>
                        </div>

                        <div className="px-4">
                            <p className="mt-2 text-center">Donnez vie à vos idées sans vous ruiner. Nos développeurs juniors vous aident à démarrer votre projet.</p>
                        </div>
                    </div>
                </div>

                {/* Bouton d'appel à l'action */}
                <div className="mt-8 font-poppins text-center mb-24">
                    <button 
                        onClick={openSignUpModal}
                        className="bg-green-tb py-2 px-4 text-white rounded mr-2 cursor-pointer"
                    >
                        Nous rejoindre
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HomeContent;