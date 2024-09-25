import React from 'react';
import Card from 'react-bootstrap/Card';

const Landingpage = () => {
    return (
        <div className="flex justify-center items-center h-screen"> {/* Full page flexbox container */}
            <Card style={{ width: '30rem' }} className="mx-2 my-2">
                <Card.Body>
                    <Card.Title>Professor Brockenbrough's User Skeleton App</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">A starting point for an application.</Card.Subtitle>
                    <Card.Text>
                    </Card.Text>
                    <Card.Link href="/signup">Sign Up</Card.Link>
                    <Card.Link href="/login">Login</Card.Link>
                </Card.Body>
            </Card>
        </div>
    );
}

export default Landingpage;
