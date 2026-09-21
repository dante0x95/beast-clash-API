/** A monster as exposed by the persistence layer. Soft-delete metadata never leaves the repository. */
export interface Monster {
  id: string;
  name: string;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}
