import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';
import { IoTicket } from "react-icons/io5";
import { TiHome } from "react-icons/ti";
import { PiChefHatLight } from "react-icons/pi";

const Header = ({ tenantData, isLoggedIn }) => {
    const navigate = useNavigate();
    return (
        <header className="header">
            <div className="header-content">
                <h1 className="logo"> <PiChefHatLight /> DirectDelivery</h1>
                <div className='buttons-header-wrap'>
                    <div onClick={() => navigate(`/${tenantData.slug}`)} className='button-header'><TiHome color='#148f8f' size={15} /></div>
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