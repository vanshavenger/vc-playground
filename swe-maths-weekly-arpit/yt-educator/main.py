import numpy as np
import pandas as pd
import time
from scipy import linalg, optimize
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ContentAnalyzer:
    def __init__(self, historical_data_path: str, creators_data_path: str):
        logger.info("Initializing ContentAnalyzer")
        self.historical_data = self._load_data(historical_data_path)
        self.creators_data = self._load_data(creators_data_path)
        self.transition_matrix = self._optimize_transition_matrix()
        self.eigenvalues, self.eigenvectors = self._analyze_eigen()

    @staticmethod
    def _load_data(file_path: str) -> np.ndarray:
        logger.info(f"Loading data from {file_path}")
        try:
            data = pd.read_csv(file_path, header=None).values
            logger.info(f"Successfully loaded data with shape {data.shape}")
            return data
        except FileNotFoundError:
            logger.error(f"File {file_path} not found")
            raise FileNotFoundError(f"Error: File {file_path} not found.")

    def _transition_error(self, matrix_flat):
        matrix = matrix_flat.reshape(2, 2)
        X = self.historical_data[:, :2]
        Y = self.historical_data[:, 2:]
        Y_pred = X @ matrix
        return np.sum((Y - Y_pred) ** 2)

    def _optimize_transition_matrix(self) -> np.ndarray:
        logger.info("Optimizing transition matrix")
        initial_guess = np.random.rand(4)
        result = optimize.minimize(self._transition_error, initial_guess, method='L-BFGS-B')
        optimized_matrix = result.x.reshape(2, 2)
        logger.info(f"Optimized transition matrix: {optimized_matrix}")
        logger.info(f"Minimized error: {result.fun}")
        return optimized_matrix

    def _analyze_eigen(self) -> tuple[np.ndarray, np.ndarray]:
        logger.info("Analyzing eigenvalues and eigenvectors")
        eigenvalues, eigenvectors = linalg.eig(self.transition_matrix)
        logger.info(f"Eigenvalues: {eigenvalues}")
        return eigenvalues, eigenvectors

    def predict_states(self, weeks: int) -> np.ndarray:
        logger.info(f"Predicting states after {weeks} weeks")
        predicted_states = np.linalg.matrix_power(self.transition_matrix, weeks) @ self.creators_data.T
        logger.info(f"Predicted states shape: {predicted_states.shape}")
        return predicted_states

    def analyze_creators(self, predicted_states: np.ndarray) -> tuple[int, int, list[int], list[int]]:
        logger.info("Analyzing creators based on predicted states")
        highest_tech = np.argmax(predicted_states[0])
        highest_ent = np.argmax(predicted_states[1])
        
        tech_focused = self.creators_data[:, 0] > self.creators_data[:, 1]
        ent_focused = ~tech_focused
        
        tech_to_ent = np.where(tech_focused & (predicted_states[0] < predicted_states[1]))[0].tolist()
        ent_to_tech = np.where(ent_focused & (predicted_states[0] > predicted_states[1]))[0].tolist()
        
        logger.info(f"Highest tech: {highest_tech}, Highest ent: {highest_ent}")
        logger.info(f"Tech to ent: {tech_to_ent}, Ent to tech: {ent_to_tech}")
        return highest_tech, highest_ent, tech_to_ent, ent_to_tech

    def interpret_eigen(self) -> list[str]:
        logger.info("Interpreting eigenvalues and eigenvectors")
        interpretations = []
        for i, (eigenvalue, eigenvector) in enumerate(zip(self.eigenvalues, self.eigenvectors.T)):
            growth = "grows" if eigenvalue.real > 1 else "decays"
            trend = "more" if eigenvector[0].real > eigenvector[1].real else "less"
            interpretation = (
                f"Component {i+1}:\n"
                f"  Eigenvalue: {eigenvalue.real:.4f}\n"
                f"  This component {growth} over time.\n"
                f"  Direction: Tech {eigenvector[0].real:.4f}, Entertainment {eigenvector[1].real:.4f}\n"
                f"  This suggests a trend towards {trend} technical content."
            )
            interpretations.append(interpretation)
        logger.info(f"Generated {len(interpretations)} eigenvalue interpretations")
        return interpretations

def main():
    try:
        start_time = time.time()
        logger.info("Starting content analysis")
        analyzer = ContentAnalyzer('data.csv', 'creators.csv')
        
        logger.info("Printing optimized transition matrix")
        print("Optimized Transition Matrix:")
        print(analyzer.transition_matrix)
        
        logger.info("Interpreting eigenvalues")
        print("\nEigenvalue Analysis:")
        for interpretation in analyzer.interpret_eigen():
            print(interpretation)
        
        logger.info("Predicting states and analyzing creators")
        predicted_states = analyzer.predict_states(4)
        highest_tech, highest_ent, tech_to_ent, ent_to_tech = analyzer.analyze_creators(predicted_states)
        
        print(f"\nCreator Analysis Results:")
        print(f"Creator with highest technical depth after 4 weeks: {highest_tech}")
        print(f"Creator with highest entertainment value after 4 weeks: {highest_ent}")
        print(f"Creators who switched from tech-focused to entertainment-focused: {tech_to_ent}")
        total_time = time.time() - start_time
        logging.info(f"Total execution time: {total_time:.4f} seconds")
    
    except FileNotFoundError as e:
        logger.error(f"File not found: {e}")
        print(e)
    except Exception as e:
        logger.error(f"An unexpected error occurred: {e}")
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    main()