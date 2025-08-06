import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Header.css';
import { IoTicket } from "react-icons/io5";
import { TiHome } from "react-icons/ti";
import { PiChefHatLight } from "react-icons/pi";

const Header = ({ tenantData, isLoggedIn }) => {
    const navigate = useNavigate();
    const location = useLocation(); // Importe e use o hook useLocation

    const handleLogoClick = () => {
        // Verifica se a rota atual é a da home
        if (location.pathname === `/${tenantData.slug}`) {
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Rola para o topo da página com animação
        } else {
            navigate(`/${tenantData.slug}`); // Navega para a home se não estiver nela
        }
    };

    return (
        <header className="header">
            <div className="header-content">
                {/* Substitua o onClick existente pela nova função handleLogoClick */}
                <h1 onClick={handleLogoClick} className="logo"> <PiChefHatLight /> DirectDelivery</h1>
                <div className='buttons-header-wrap'>
                    {isLoggedIn &&
                        <div onClick={() => navigate(`/${tenantData.slug}/orders`)} className='button-header'>
                            <IoTicket className="with-text" color='#148f8f' size={15} /> Meus pedidos
                        </div>}
                </div>
            </div>
        </header>
    );
};

export default Header;