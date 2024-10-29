import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
import { HiOutlineMenuAlt3 } from "react-icons/hi";

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    // Função para fechar o menu
    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    return (
        <header className="header">
            <div className="header-content">
                <h1 className="logo">DirectDelivery</h1>
                <HiOutlineMenuAlt3 className='menu-toggle' size={30} color='white' onClick={toggleMenu}/>
                <nav className={`nav ${isMenuOpen ? 'open' : ''}`}>
                    <ul className="nav-links">
                        <li>
                            <Link to="/" onClick={closeMenu}>Início</Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
};

export default Header;