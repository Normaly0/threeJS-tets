import { useRef, useEffect } from 'react';
import { Canvas } from "@react-three/fiber";

function Responsive() {

    const boxRef = useRef();

    const canvasWidth = window.innerWidth;
    const pos = canvasWidth * 0.25;

    useEffect(() => {
        boxRef.current.position.x = pos
        console.log(boxRef.current.position.x)
    }, [boxRef])


    return (

        <>

            <mesh ref={boxRef}>
                <boxGeometry args={[1.5, 2, 2]}/>
                <meshBasicMaterial color={'orange'} />
            </mesh>

            <mesh>
                <boxGeometry args={[1, 1, 1]}/>
                <meshBasicMaterial color={'red'} />
            </mesh>

        </>


    )

}

export default Responsive;