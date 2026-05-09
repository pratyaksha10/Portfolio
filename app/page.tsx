'use client';

import CanvasLoader from "./components/common/CanvasLoader";
import ScrollWrapper from "./components/common/ScrollWrapper";
import Experience from "./components/experience";
import Footer from "./components/footer";
import Hero from "./components/hero";

const Home = () => {
  return (
    <CanvasLoader>
      {/* Hidden semantic HTML for SEO */}
      <div className="sr-only">
        <h1>Pratyaksha | Creative Frontend Engineer Portfolio</h1>
        <p>Hi, I am Pratyaksha. A frontend developer by profession, a creative at heart.</p>
        <section>
          <h2>Professional Experience</h2>
          <ul>
            <li>Work & Projects</li>
            <li>My Journey</li>
            <li>Literature & Creative Writing</li>
            <li>Other Ventures</li>
          </ul>
        </section>
        <footer>
          <p>Connect with me on Instagram, Behance, and GitHub.</p>
        </footer>
      </div>
      
      <ScrollWrapper>
        <Hero/>
        <Experience/>
        <Footer/>
      </ScrollWrapper>
    </CanvasLoader>
  );
};
export default Home;
