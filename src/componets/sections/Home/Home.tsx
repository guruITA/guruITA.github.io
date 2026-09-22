import styles from './Home.module.scss';
import profileImage from '../../../assets/profile.webp';
import ThreeBackground from '../../background/ThreeBackground/ThreeBackground';

function Home() {
    return (
        <section className={styles.home} id="home">
            <ThreeBackground />

            <div className={styles.homeContent}>
                <div className={styles.content}>
                    <p className={styles.introduction}>Hi, I'm</p>

                    <h1>Gurpreet Singh</h1>

                    <h2>
                        Software Engineering Student & Full-Stack Developer
                    </h2>

                    <p className={styles.description}>
                        I enjoy building software, learning new technologies
                        and improving my development skills every day.
                    </p>

                    <div className={styles.actions}>
                        <a href="#projects">View Projects</a>
                        <a href="#contact">Contact Me</a>
                    </div>
                </div>

                <div className={styles.image}>
                    <img src={profileImage} alt="" />
                </div>
            </div>
        </section>
    );
}

export default Home;