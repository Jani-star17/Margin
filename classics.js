const CLASSICS = [
["Alice's Adventures in Wonderland","Lewis Carroll",11],["Frankenstein","Mary Shelley",84],
["Pride and Prejudice","Jane Austen",1342],["Moby Dick","Herman Melville",2701],
["Dracula","Bram Stoker",345],["The Adventures of Sherlock Holmes","Arthur Conan Doyle",1661],
["Great Expectations","Charles Dickens",1400],["Jane Eyre","Charlotte Bronte",1260],
["A Tale of Two Cities","Charles Dickens",98],["Wuthering Heights","Emily Bronte",768],
["The Picture of Dorian Gray","Oscar Wilde",174],["Treasure Island","Robert Louis Stevenson",120],
["Little Women","Louisa May Alcott",514],["Peter Pan","J. M. Barrie",16],
["Adventures of Huckleberry Finn","Mark Twain",76],["The Adventures of Tom Sawyer","Mark Twain",74],
["The Metamorphosis","Franz Kafka",5200],["The Art of War","Sun Tzu",132],
["The Count of Monte Cristo","Alexandre Dumas",1184],["Don Quixote","Miguel de Cervantes",996],
["The Odyssey","Homer",1727],["The Iliad","Homer",6130],["The Republic","Plato",1497],
["The Time Machine","H. G. Wells",35],["The War of the Worlds","H. G. Wells",36],
["The Jungle Book","Rudyard Kipling",236],["The Secret Garden","Frances Hodgson Burnett",113],
["Anne of Green Gables","L. M. Montgomery",45],["Gulliver's Travels","Jonathan Swift",829],
["Crime and Punishment","Fyodor Dostoevsky",2554],["The Scarlet Letter","Nathaniel Hawthorne",33]
];
async function searchGutenberg(q) {
  q = (q || "").toLowerCase();
  return CLASSICS.filter(c => !q || (c[0] + " " + c[1]).toLowerCase().includes(q)).map(c => ({
    title: c[0], author: c[1], tag: "public domain",
    load: async () => {
      const u = "https://www.gutenberg.org/cache/epub/" + c[2] + "/pg" + c[2] + ".txt";
      const r = await fetch("/api/proxy?url=" + encodeURIComponent(u));
      if (!r.ok) throw new Error("download failed");
      return { id: "g" + c[2], title: c[0], author: c[1], kind: "text", text: await r.text(), added: Date.now() };
    }
  }));
}
