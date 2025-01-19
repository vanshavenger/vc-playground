import numpy as np
from log import setup_logger

logger = setup_logger()

OBSERVATION_ERROR = 'observation error'

def is_matrix_singular(A: list[list[int]]) -> bool:
    det = np.linalg.det(A)
    logger.info(det)
    return abs(det) < 1e-10 

def solve_linear_system(A: list[list[int]], B: list[int]) -> list[int]:
    n = len(A)
    combined = [row + [b] for row, b in zip(A, B)]
    
    if is_matrix_singular(A):
        raise ValueError('Singular matrix')
    
    for i in range(n):
        max_element = abs(combined[i][i])
        max_row = i
        for k in range(i + 1, n):
            if abs(combined[k][i]) > max_element:
                max_element = abs(combined[k][i])
                max_row = k
        
        if max_element < 1e-10:
            raise ValueError('All values of the row are 0')
        
        combined[i], combined[max_row] = combined[max_row], combined[i]
        
        
        for k in range(i + 1, n):
            c = -combined[k][i] / combined[i][i]
            for j in range(i, n + 1):
                if i == j:
                    combined[k][j] = 0
                else:
                    combined[k][j] += c * combined[i][j]
                
    
    x = [0] * n
    for i in range(n - 1, -1, -1):
        x[i] = combined[i][n] / combined[i][i]
        logger.info(x)
        for k in range(i - 1, -1, -1):
            combined[k][n] -= combined[k][i] * x[i]
    
    return x

def process_input(input_str: str) -> str:
    lines = input_str.strip().split('\n')
    N, M = map(int, lines[0].split())
    equations = [list(map(float, line.split())) for line in lines[1:]]
    logger.info(equations)
    
    if N != M:
        return OBSERVATION_ERROR
    
    try:
        A = [eq[:-1] for eq in equations]
        B = [eq[-1] for eq in equations]
        X = solve_linear_system(A, B)
        return ' '.join(f'{x:.6f}' for x in X)
    except ValueError:
        return OBSERVATION_ERROR

input1 = """
3 3
2 1 3 95
1 3 1 82
3 2 1 75
"""

input2 = """
3 3
2 1 0 95
1 3 0 82
3 2 0 75
"""

print(process_input(input1))
print(process_input(input2))


