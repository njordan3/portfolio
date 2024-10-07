import { useSearchParams } from '@remix-run/react';

import './styles/terminal-dark.css';
import './styles/_index.css';

import me from '../../assets/me.jpg';
import yosemiteDrink from '../../assets/yosemite-drink.jpg';
import craterLake from '../../assets/crater-lake.jpg';
import halfDomeClimbingDown from '../../assets/half-dome-climbing-down.jpeg';
import kernRiverHike from '../../assets/kern-river-hike.jpg';
import yosemiteValley from '../../assets/yosemite-valley.jpg';
import resume from '../../assets/resume.pdf';


import { Form } from 'react-router-dom';
import ImageCarousel from '../components/image-carousel';

export default function Index() {
    const linkedIn = 'https://www.linkedin.com/in/nicholas-jordan-80657920b/';
    const github = 'https://github.com/njordan3';

    const [searchParams] = useSearchParams();
    const showMoreAboutMe = parseInt(searchParams.get('more-about-me') || 0);

    return (
        <>
            <div className="container">
                <div className="terminal-nav">
                    <div className="terminal-logo">
                        <div className="logo terminal-prompt">
                            <a href={linkedIn} target="_blank" className="no-style">Nicholas Jordan</a>
                        </div>
                    </div>
                    <nav className="terminal-menu">
                        <ul>
                            <li><a className="menu-item" href="#bio">Bio</a></li>
                            <li><a className="menu-item" href="#work">Work</a></li>
                            <li><a className="menu-item" href="#projects">Projects</a></li>
                            <li><a className="menu-item" href="#contributors">Contributors</a></li>
                        </ul>
                    </nav>
                </div>
                <br/>
                <div className="components components-grid">
                    <div>
                        <aside id="menu">
                            <h2>Resources</h2>
                            <nav>
                                <ul>
                                    <li className="mb-2"><a href={resume} target="_blank">View Resume</a></li>
                                    <li className="mb-2"><a href="mailto:nijordan99@gmail.com" target="_blank">Email Me</a></li>
                                    <li className="mb-2"><a href={linkedIn} target="_blank">My LinkedIn</a></li>
                                    <li className="mb-2"><a href={github} target="_blank">My Github</a></li>
                                </ul>
                            </nav>
                        </aside>
                    </div>
                    <main>
                        <section>
                            <header><h2 id="bio">Hey, my name is Nick and I enjoy solving problems.</h2></header>
                            <img src={me} alt="A picture of me in snowy woods" />
                        </section>
                        <hr/>
                        <section>
                            <header><h2 id="bio">Bio</h2></header>
                            <p>Like many computer science majors, my interest in the field began with playing video games as a kid.</p>
                            <p>
                                This lead me to build my own computer, get my first job in IT, and take engineering classes in highschool only to find a love for creating logistical solutions.
                                My future college courses and work experience only reinforced this.    
                            </p>
                            <p>Thanks to video games, I'm always looking for new opportunities to solve interesting logistical challenges!</p>
                            <Form replace>
                                {showMoreAboutMe === 1 ? (
                                    <button name="more-about-me" value={0} className="terminal-prompt">
                                        <span className="fake-a">Eh, I don't care anymore.</span>
                                    </button>
                                ) : (
                                    <button name="more-about-me" value={1} className="terminal-prompt">
                                        <span className="fake-a">Wanna know more about me?</span>
                                    </button>
                                )}
                            </Form>
                            {showMoreAboutMe === 1 && (
                                <fieldset className="mt-2">
                                    <legend>Hobbies</legend>
                                    <h3>Video Games</h3>
                                    <p>
                                        I grew up playing Halo and Call of Duty on the original Xbox and Xbox 360.
                                        I started to move towards PC gaming around junior high with my first laptop playing the alpha version of Minecraft.
                                        My transition to PC gaming finalized when I built my first gaming PC during sophomore year of high school.
                                        Halo and the classic Call of Duties have a special place in my heart, but most of my game time lately has been towards:
                                    </p>
                                    <ul>
                                        <li>Team Fortress 2</li>
                                        <li>Modded Minecraft</li>
                                        <li>Factorio</li>
                                        <li>Satisfactory</li>
                                    </ul>
                                    <p>
                                        Many games phased in and out of my interest, but I'm currently most interested in <a href="https://en.wikipedia.org/wiki/Shooter_game#Boomer_shooter" target="_blank">boomer shooters</a> and <a href="https://en.wikipedia.org/wiki/Construction_and_management_simulation#Factory_simulation_games" target="_blank">base building/automation</a> games.
                                    </p>
                                    <hr/>
                                    <h3>Hiking</h3>
                                    <p>
                                        With a job and hobby that has so much desk-time I try to counteract this with some hiking on the weekends. Living in Pasadena, CA
                                        there are many great hiking trails in the foothills and mountains of the Angeles National Forest. Some of my favorite local trails include:
                                    </p>
                                    <ul>
                                        <li><a href="https://www.alltrails.com/trail/us/california/echo-mountain-via-sam-merrill-trail--4" target="_blank">Echo Mountain</a></li>
                                        <li><a href="https://www.alltrails.com/trail/us/california/mount-san-antonio-mount-baldy-notch-trail" target="_blank">Mt. Baldy</a></li>
                                        <li><a href="https://www.alltrails.com/trail/us/california/strawberry-peak-trail-via-redbox-canyon" target="_blank">Strawberry Peak</a></li>
                                    </ul>
                                    <ImageCarousel images={[
                                        {
                                            src: kernRiverHike,
                                            alt: 'Hiking by the Kern River',
                                            caption: 'Hiking by the Kern River'
                                        },
                                        {
                                            src: craterLake,
                                            alt: 'Crater Lake',
                                            caption: 'Crater Lake'
                                        }
                                    ]}/>
                                    <p>
                                        The most intense (physically and psycologically) hike I've ever done was Half Dome in Yosemite. It took me and 2 friends 11 hours to complete the 20 mile round-trip hike.
                                        Getting to the sub-dome and looking up at the final stretch was incredibly intimidating and I was close to not commiting to it.
                                        I highly recommend the experience to anyone who is able and would love to get the chance to do it again.
                                    </p>
                                    <ImageCarousel images={[
                                        {
                                            src: yosemiteDrink,
                                            alt: 'Taking a drink from Nevada Falls',
                                            caption: 'Taking a drink from Nevada Falls'
                                        },
                                        {
                                            src: halfDomeClimbingDown,
                                            alt: 'Climbing down Half Dome',
                                            caption: 'Climbing down Half Dome'
                                        },
                                        {
                                            src: yosemiteValley,
                                            alt: 'Yosemite Valley',
                                            caption: 'Yosemite Valley'
                                        }
                                    ]}/>
                                    <p>I love national parks and forests and have definitely not visited enough of them, but many are on my list.</p>
                                    <hr/>
                                    <p>I also enjoy cooking and baking bread. I get a lot of my inspiration from various cooking Youtube channels.</p>
                                    <p> 
                                        Lately I've also been trying my hand at oil painting landscapes (think Bob Ross).
                                        I've only done a handful, but I do feel like I'm improving. At least in technique.
                                    </p>
                                </fieldset>
                            )}
                        </section>
                        <hr/>
                        <section>
                            <header><h2 id="work">Education and Work Experience</h2></header>
                            <div className="terminal-timeline">
                                <div className="terminal-card">
                                    <header>IT Guy</header>
                                    <div>
                                        <p>My work experience began as a 16 year old IT guy at an elementary school district.</p>
                                        <p>I stuck with this well through college and learned a lot about support work as well as collaborating with "clients" (teachers) to find the best solutions for their use cases.</p>
                                    </div>
                                </div>
                                <div className="terminal-card">
                                    <header>Bachelor of Science (2017 - 2021)</header>
                                    <div>
                                        <p>Run-of-the-mill 4-year bachelors degree in computer science from CSU Bakersfield. I Learned about programming, math, databases, etc.</p>
                                        <p>My senior project was essentially "Duolingo but for ASL" using an AI model trained to detect the letters A through E from a webcam.</p>
                                        <p>I was responsible for setting up the app, database, and several mini-games. We called it <a href={`${github}/Handango`} target="_blank">"Handango"</a>.</p>
                                        <p>I'm sure I'd be embarrassed of most of that code if I took a look at it now; although I was proud of it at the time!</p>
                                        <p>We didn't end up taking this project anywhere after graduation, so this hasn't been developed further.</p>
                                        <p>
                                            I'm being brief about my college experience, but it was very valuable to me because it exposed me
                                            to different technologies, methodologies, languages, as well as collaboration.
                                            Coming out of it I felt very prepared to enter the job market.
                                        </p>
                                    </div>
                                </div>
                                <div className="terminal-card">
                                    <header>Fox Dealer (2021 - Current)</header>
                                    <div>
                                        <p>
                                            My previous work and education experience carried over well to my first full-time,
                                            and current, job at <a href="https://www.foxdealer.com/" target="_blank">Fox Dealer</a>.
                                        </p>
                                        <p>There is a lot to say about my first professional experience here so I'll try to condense it.</p>
                                        <p>I have accomplished a lot that I'm proud of:</p>
                                        <ul>
                                            <li>Optimized our CMS dashboard and cron job performance</li>
                                            <li>Refactored a lot of outdated legacy code</li>
                                            <li>Created a JSON template system for our inventory data exports to reduce the needed dev time for new exports</li>
                                            <li>Permanently fixed many inventory data bugs and anomolies causing repeat issues for our clients</li>
                                            <li>Successfully integrated our system with 3 new OEM program partnerships and 4 new inventory data sources</li>
                                        </ul>
                                        <p>And I have been able to refine many of my skills and develop some new ones:</p>
                                        <ul>
                                            <li>Collaboration with clients, third parties, and engineers</li>
                                            <li>Improved problem solving abilities</li>
                                            <li>AWS experience with EC2, Amplify, and Lamdba</li>
                                        </ul>
                                        <p>
                                            Most of my day-to-day work involves handling support tickets, fixing bugs within our CMS and inventory systems,
                                            working on new features in our roadmap, and creating documentation for use across multiple teams.
                                            We are always getting new feature requests and compliance requirements from our partnered OEMs (Toyota, Nissan, GM Canada, etc),
                                            so I'm familiar with looking through documentation and designing ways to appropriately fit it within our system.
                                        </p>
                                        <p>
                                            Over these 3+ years I've proven myself to be a reliable problem solver and strong communicator;
                                            becoming a go-to-guy within the company for backend systems inquiries.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>
                        <hr/>
                        <section>
                            <header><h2 id="projects">Projects</h2></header>
                            <p>
                                Like most programmers, most of my personal coding projects have never seen the light of day.
                                My projects have mostly been me messing around with Unreal Engine, Godot, or just simple mini-games in Javascript.
                                Feel free to check out my <a href={github}>Github</a> to see all the old projects I've got lying around.
                            </p>
                            <ul className="mx-4">
                                <li><a href={`${github}/TankGameV2`} target="_blank">Tank Game V2</a></li>
                                <li><a href={`${github}/godot-terrain`} target="_blank">Godot Terrain</a></li>
                                <li><a href={`${github}/Double-Solitaire`} target="_blank">Double Solitaire</a></li>
                                <li><a href={`${github}/double-solitaire-v2`} target="_blank">Double Solitaire V2</a></li>
                                <li><span className="fake-a">More Coming Soon...</span></li>
                            </ul>
                        </section>
                        <hr/>
                        <section>
                            <header><h2 id="contributors" className="mb-0">Contributors</h2></header>
                            <div className="flex justify-start">
                                <ul className="mx-4">
                                    <li><a href="https://www.linkedin.com/in/adam-hazelton-93a7a5125/" target="_blank">Adam</a></li>
                                    <li><a href="https://www.linkedin.com/in/alexisis-barcenas-29198a1b8/" target="_blank">Alexisis</a></li>
                                    <li><span className="fake-a">Daniel</span></li>
                                    <li><a href="https://www.linkedin.com/in/ethan-coon/" target="_blank">Ethan</a></li>
                                    <li><a href="https://www.linkedin.com/in/jack-snider-6b7538122/" target="_blank">Jack</a></li>
                                    <li><a href="https://www.linkedin.com/in/robertpipkin/" target="_blank">Robert</a></li>
                                    <li><a href="https://www.linkedin.com/in/seanpatiag/" target="_blank">Sean</a></li>
                                </ul>
                                <ul className="mx-4">
                                    <li><span className="fake-a">Mother</span></li>
                                    <li><span className="fake-a">Father</span></li>
                                    <li><span className="fake-a">Sister</span></li>
                                    <li><span className="fake-a">Grandma</span></li>
                                </ul>
                                <ul className="mx-4">
                                    <li><span className="fake-a">And many more...</span></li>
                                </ul>
                            </div>
                        </section>
                    </main>
                </div>
            </div>
            <div className="terminal-banner">
                <div className="container-fluid">
                    Thanks for taking a look!
                </div>
            </div>
        </>
    );
}