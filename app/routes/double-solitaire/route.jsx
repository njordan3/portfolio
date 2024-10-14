import { Suspense } from 'react';
import Board from "./board";

import '@styles/terminal-dark.css';
import './styles/route.css';

export default function DoubleSolitaire() {
    return (
        <div id="container">
            <div id="header"></div>
            <div id="left-sidebar"></div>
            <Suspense fallback={'Loading...'}>
                <Board/>
            </Suspense>
            <div id="right-sidebar"></div>
            <div id="footer"></div>
        </div>
    );
}