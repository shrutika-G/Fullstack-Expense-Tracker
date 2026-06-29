import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../../services/auth.service';
import '../../assets/styles/sidebar.css';
import SideBarLinks from './sideBarLinks';
import { useState } from 'react';
import AuthVerify from '../../services/auth.verify';
import Logo from '../utils/Logo';

function Sidebar({ activeNavId }) {
    const [isSideBarOpen, setIsSideBarOpen] = useState(false);
    const navigate = useNavigate();

    const currentUser = AuthService.getCurrentUser();
    const isAdmin = currentUser?.roles?.includes("ROLE_ADMIN");

    const logout = () => {
        localStorage.clear();
        sessionStorage.clear();
        navigate('/auth/login');
        window.location.reload();
    };

    const filteredLinks = SideBarLinks.filter(link => {
        if (!currentUser) return false;

        // If admin, show only admin links
        if (isAdmin) {
            return link.role === "ROLE_ADMIN";
        }

        // If normal user, show only user links
        return link.role === "ROLE_USER";
    });

    return (
        <div className={isSideBarOpen ? "side-bar open" : "side-bar"}>
            <div style={{
                padding: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Logo />

                <span onClick={() => setIsSideBarOpen(false)} className='mobile'>
                    <i className="fa fa-times" aria-hidden='true'></i>
                </span>

                <span onClick={() => setIsSideBarOpen(true)} className='mobile menu'>
                    <i className="fa fa-bars" aria-hidden='true'></i>
                </span>
            </div>

            <ul>
                {filteredLinks.map((link) => (
                    <Link key={link.id} className='nav-link' to={link.to}>
                        <li className={activeNavId === link.id ? "active" : ""}>
                            <i className={link.icon} aria-hidden='true'></i>
                            {link.name}
                        </li>
                    </Link>
                ))}

                <li
                    onClick={logout}
                    className='logout-link'
                    style={{ cursor: "pointer" }}
                >
                    <i className="fa fa-sign-out" aria-hidden="true"></i>
                    Log out
                </li>
            </ul>

            <AuthVerify logOut={logout} />
        </div>
    );
}

export default Sidebar;