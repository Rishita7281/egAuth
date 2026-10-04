const amqp=require('amqplib')
let keyChannel;
const EXCHANGE_KEY = 'key_exchange';

async function setupKeyChannel() {
  try {

      keyChannel = await connection.createChannel();
      await keyChannel.assertExchange(EXCHANGE_KEY, 'fanout', { durable: true });
      console.log(`Key channel setup complete for exchange: ${EXCHANGE_KEY}`);

      keyChannel.on('error', (err) => {
        console.error('Error in keyChannel:', err.message);
        keyChannel = null;
        setTimeout(setupKeyChannel, 5000); // Retry after 5 seconds
      });
    
  } catch (err) {
    console.error('Error setting up keyChannel:', err.message);
    setTimeout(setupKeyChannel, 5000); // Retry after 5 seconds
  }
}


module.exports = { setupKeyChannel, KeyChannel,EXCHANGE_KEY };
