import { Keypair } from '@solana/web3.js';
import { TokenStandard, createAndMint } from '@metaplex-foundation/mpl-token-metadata';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import fs from 'fs';

// Configuration
const config = {
    DECIMALS: 9n,
    MAX_SUPPLY: 50000000000n,
    API_URL: 'https://api.devnet.solana.com',
    TOKEN_NAME: 'Gold Digger',
    TOKEN_SYMBOL: 'GLDD',
    DESCRIPTION: 'Gold Digger Token ($GLDD) is a fungible token built on the Solana blockchain, designed specifically for meme enthusiasts and creators.',
    WEBSITE_URL: 'https://golddigger.net',
    SECRET_KEY_FILE: './src/keypairs/secretKey.json',
};

// Function to read secret key from file
async function readSecretKey(): Promise<string> {
    try {
        const secretKey = await fs.readFile(config.SECRET_KEY_FILE, 'utf-8');
        return secretKey.trim();
    } catch (error) {
        throw new Error(`Error reading secret key from file: ${error}`);
    }
}

// Main function to mint tokens
async function mintTokens(): Promise<void> {
    try {
        console.info('Starting token minting process...');

        // Read secret key from file
        const secretKey = await readSecretKey();

        // Initialize Umi instance with Solana extension
        const umi = await createUmi(config.API_URL);

        // Create mint signer
        const mintSigner = Keypair.fromSecretKey(Buffer.from(secretKey, 'base64'));

        // Generate token metadata
        const metadata = {
            name: config.TOKEN_NAME,
            symbol: config.TOKEN_SYMBOL,
            description: config.DESCRIPTION,
            seller_fee_basis_points: 0,
            creators: [],
            royalties: [],
            uri: config.WEBSITE_URL ? `${config.WEBSITE_URL}/${config.TOKEN_SYMBOL.toLowerCase()}.json` : '',
            files: [
                {
                    uri: 'https://ipfs.io/ipfs/QmPB8JfsYJ1Buf9pd3BDiHyiFmZBGy1mJ5FyuQHUzX7XaQ?filename=gold-digger.png',
                    type: 'image/png',
                },
            ],
        };

        // Mint Gold Digger tokens
        const mintTx = await createAndMint(umi, {
            mint: mintSigner,
            authority: mintSigner.publicKey,
            metadata: metadata,
            decimals: Number(config.DECIMALS),
            amount: config.MAX_SUPPLY.toString(),
            tokenOwner: mintSigner.publicKey,
            tokenStandard: TokenStandard.Fungible,
        }).sendAndConfirm(umi);

        console.info(`Successfully minted ${config.MAX_SUPPLY} Gold Digger tokens (${mintSigner.publicKey})`);
        console.info('Transaction:', mintTx);
    } catch (error) {
        console.error(`An error occurred during token minting: ${error.message || error}`);
    }
}

// Call the main function to mint Gold Digger tokens
mintTokens();
